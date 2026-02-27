import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  Redemption,
  EmployeeCoupon,
  SellerNonce,
  LedgerEntry,
  User,
  CouponTypeEntity,
} from '../../entities';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RedemptionService {
  private readonly logger = new Logger(RedemptionService.name);

  constructor(
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    @InjectRepository(EmployeeCoupon)
    private readonly employeeCouponRepository: Repository<EmployeeCoupon>,
    @InjectRepository(SellerNonce)
    private readonly sellerNonceRepository: Repository<SellerNonce>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) { }

  async createRedemption(dto: {
    employeeId: string;
    sellerUUID: string;
    nonce: string;
    couponTypeId: string;
    quantity: number;
    timestamp: string;
    deviceSignature: string;
    idempotencyKey: string;
  }) {
    // Step 0: Idempotency check — prevent duplicate submissions
    if (dto.idempotencyKey) {
      const existing = await this.redemptionRepository.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        this.logger.warn(
          `Duplicate redemption detected: idempotencyKey=${dto.idempotencyKey}`,
        );
        return {
          id: existing.id,
          status: existing.status,
          message: 'Duplicate request — original redemption returned',
          createdAt: existing.createdAt,
        };
      }
    }

    // Step 0.5: Rate limiting — max 120 redemptions per vendor per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await this.redemptionRepository
      .createQueryBuilder('r')
      .where('r.sellerId = :sellerId', { sellerId: dto.sellerUUID })
      .andWhere('r.createdAt > :since', { since: oneMinuteAgo })
      .getCount();

    if (recentCount >= 120) {
      throw new BadRequestException(
        'Rate limit exceeded: too many redemptions for this vendor',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Validate seller nonce with pessimistic lock (SELECT ... FOR UPDATE)
      const nonce = await queryRunner.manager
        .createQueryBuilder(SellerNonce, 'sn')
        .setLock('pessimistic_write')
        .where('sn.nonce = :nonce', { nonce: dto.nonce })
        .andWhere('sn.consumed = false')
        .getOne();

      if (!nonce) {
        throw new ConflictException(
          'Seller nonce is invalid or already consumed',
        );
      }

      // Check nonce expiry (10 min + 30 sec clock drift allowance)
      const expiryWithDrift = new Date(nonce.expiresAt.getTime() + 30 * 1000);
      if (expiryWithDrift < new Date()) {
        throw new ConflictException('Seller nonce has expired');
      }

      // Step 1.5: Verify HMAC signature
      const hmacSecret = this.configService.get<string>(
        'SELLER_QR_HMAC_SECRET',
        'change-this-seller-qr-secret',
      );
      const expectedSignature = createHmac('sha256', hmacSecret)
        .update(
          `${nonce.sellerId}:${nonce.nonce}:${nonce.expiresAt.toISOString()}`,
        )
        .digest('hex');

      if (nonce.hmacSignature !== expectedSignature) {
        throw new ConflictException('Seller QR signature verification failed');
      }

      // Security check: If sellerUUID is provided, it must match the nonce's sellerId
      if (dto.sellerUUID && dto.sellerUUID !== nonce.sellerId) {
        throw new ConflictException(
          'Seller UUID mismatch: request payload does not match QR signature',
        );
      }

      // Step 2: Lock employee balance row (SELECT ... FOR UPDATE)
      const coupon = await queryRunner.manager
        .createQueryBuilder(EmployeeCoupon, 'ec')
        .setLock('pessimistic_write')
        .where('ec.employeeId = :employeeId', {
          employeeId: dto.employeeId,
        })
        .andWhere('ec.couponTypeId = :couponTypeId', {
          couponTypeId: dto.couponTypeId,
        })
        .getOne();

      if (!coupon || coupon.balance < dto.quantity) {
        throw new BadRequestException('Insufficient coupon balance');
      }

      const couponType = await queryRunner.manager.findOne(CouponTypeEntity, {
        where: { id: dto.couponTypeId },
      });
      const couponAmount = couponType?.amount ? Number(couponType.amount) : 0;

      // Step 3: Deduct balance
      coupon.balance -= dto.quantity;
      await queryRunner.manager.save(coupon);

      // Step 4: Insert ledger entry (append-only)
      const ledgerEntry = queryRunner.manager.create(LedgerEntry, {
        employeeId: dto.employeeId,
        sellerId: nonce.sellerId, // Use verified sellerId from nonce
        type: 'REDEMPTION',
        amount: (couponAmount * dto.quantity),
        quantity: dto.quantity,
        refNonce: dto.nonce,
        couponType: couponType?.name,
      });
      await queryRunner.manager.save(ledgerEntry);

      // Step 5: Create redemption record
      const redemption = queryRunner.manager.create(Redemption, {
        employeeId: dto.employeeId,
        sellerId: nonce.sellerId, // Use verified sellerId from nonce
        couponTypeId: dto.couponTypeId,
        quantity: dto.quantity,
        nonce: dto.nonce,
        deviceSignature: dto.deviceSignature,
        idempotencyKey: dto.idempotencyKey,
        status: 'COMPLETED',
      });
      await queryRunner.manager.save(redemption);

      // Step 6: Consume nonce (single-use)
      nonce.consumed = true;
      await queryRunner.manager.save(nonce);

      // Step 7: Update employee streak
      const employee = await queryRunner.manager.findOne(User, {
        where: { id: dto.employeeId },
      });
      if (employee) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = employee.lastRedemptionDate
          ? new Date(employee.lastRedemptionDate)
          : null;
        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0);
        }

        if (!lastDate || lastDate.getTime() < today.getTime()) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastDate && lastDate.getTime() === yesterday.getTime()) {
            employee.currentStreak += 1;
          } else if (!lastDate || lastDate.getTime() < yesterday.getTime()) {
            employee.currentStreak = 1;
          }

          if (employee.currentStreak > employee.longestStreak) {
            employee.longestStreak = employee.currentStreak;
          }
          employee.lastRedemptionDate = new Date();
          employee.engagementPoints += 10;
          await queryRunner.manager.save(employee);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Redemption completed: employee=${dto.employeeId}, seller=${dto.sellerUUID}, qty=${dto.quantity}`,
      );

      // Step 8: Dual push notifications (async, after commit)
      const seller = await this.userRepository.findOne({
        where: { id: nonce.sellerId },
      });
      this.notificationService
        .sendPush({
          userId: dto.employeeId,
          title: '✅ Coupon Redeemed',
          body: `${dto.quantity} coupon(s) redeemed at ${seller?.name || 'Unknown Seller'}`,
        })
        .catch((err) =>
          this.logger.error(`Push to employee failed: ${err.message}`),
        );
      this.notificationService
        .sendPush({
          userId: nonce.sellerId,
          title: '☕ Coupon Redeemed',
          body: `${dto.quantity} coupon(s) redeemed by ${employee?.name || 'Employee'}`,
        })
        .catch((err) =>
          this.logger.error(`Push to seller failed: ${err.message}`),
        );

      return {
        id: redemption.id,
        status: 'COMPLETED',
        remainingBalance: coupon.balance,
        streakCount: employee?.currentStreak || 0,
        message: 'Redemption successful',
        createdAt: redemption.createdAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistory(employeeId: string, page = 1, limit = 20) {
    const [items, total] = await this.redemptionRepository.findAndCount({
      where: { employeeId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }
}
