import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transfer, EmployeeCoupon, LedgerEntry, User, CouponTypeEntity } from '../../entities';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(EmployeeCoupon)
    private readonly employeeCouponRepository: Repository<EmployeeCoupon>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) { }

  async createTransfer(dto: {
    senderId: string;
    recipientId: string;
    nonce: string;
    couponTypeId: string;
    quantity: number;
    deviceSignature: string;
    appreciationMessage?: string;
  }) {
    // Prevent self-transfer
    if (dto.senderId === dto.recipientId) {
      throw new BadRequestException('Cannot transfer coupons to yourself');
    }

    // Verify recipient exists
    const recipient = await this.userRepository.findOne({
      where: { id: dto.recipientId, role: 'EMPLOYEE' },
    });
    if (!recipient) {
      throw new BadRequestException(
        'Recipient not found or is not an employee',
      );
    }

    const sender = await this.userRepository.findOne({
      where: { id: dto.senderId },
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock sender balance row (SELECT ... FOR UPDATE)
      const senderCoupon = await queryRunner.manager
        .createQueryBuilder(EmployeeCoupon, 'ec')
        .setLock('pessimistic_write')
        .where('ec.employeeId = :employeeId', { employeeId: dto.senderId })
        .andWhere('ec.couponTypeId = :couponTypeId', {
          couponTypeId: dto.couponTypeId,
        })
        .getOne();

      if (!senderCoupon || senderCoupon.balance < dto.quantity) {
        throw new BadRequestException('Insufficient coupon balance');
      }

      // Debit sender
      senderCoupon.balance -= dto.quantity;
      await queryRunner.manager.save(senderCoupon);

      // Credit recipient (create if not exists), also lock
      let recipientCoupon = await queryRunner.manager
        .createQueryBuilder(EmployeeCoupon, 'ec')
        .setLock('pessimistic_write')
        .where('ec.employeeId = :employeeId', {
          employeeId: dto.recipientId,
        })
        .andWhere('ec.couponTypeId = :couponTypeId', {
          couponTypeId: dto.couponTypeId,
        })
        .getOne();

      if (!recipientCoupon) {
        recipientCoupon = queryRunner.manager.create(EmployeeCoupon, {
          employeeId: dto.recipientId,
          couponTypeId: dto.couponTypeId,
          balance: 0,
        });
      }
      recipientCoupon.balance += dto.quantity;
      await queryRunner.manager.save(recipientCoupon);

      // Fetch coupon type for its monetary amount
      const couponType = await queryRunner.manager.findOne(CouponTypeEntity, {
        where: { id: dto.couponTypeId },
      });
      const couponAmount = couponType?.amount ? Number(couponType.amount) : 0;

      // Insert debit ledger entry
      await queryRunner.manager.save(
        queryRunner.manager.create(LedgerEntry, {
          employeeId: dto.senderId,
          type: 'TRANSFER_DEBIT',
          amount: (couponAmount * dto.quantity),
          quantity: dto.quantity,
          couponType: couponType?.name,
        }),
      );

      // Insert credit ledger entry
      await queryRunner.manager.save(
        queryRunner.manager.create(LedgerEntry, {
          employeeId: dto.recipientId,
          type: 'TRANSFER_CREDIT',
          amount: (couponAmount * dto.quantity),
          quantity: dto.quantity,
          couponType: couponType?.name,
        }),
      );

      // Create transfer record
      const transfer = queryRunner.manager.create(Transfer, {
        senderId: dto.senderId,
        recipientId: dto.recipientId,
        couponTypeId: dto.couponTypeId,
        quantity: dto.quantity,
        appreciationMessage: dto.appreciationMessage,
      });
      await queryRunner.manager.save(transfer);

      // Award Appreciation Star points to sender (+15)
      if (sender) {
        sender.engagementPoints += 15;
        await queryRunner.manager.save(sender);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Transfer completed: sender=${dto.senderId} → recipient=${dto.recipientId}, qty=${dto.quantity}`,
      );

      // Dual push notifications (async, after commit)
      this.notificationService
        .sendPush({
          userId: dto.senderId,
          title: '🎁 Coupon Gifted',
          body: `You gifted ${dto.quantity} coupon(s) to ${recipient.name}`,
        })
        .catch((err) =>
          this.logger.error(`Push to sender failed: ${err.message}`),
        );
      this.notificationService
        .sendPush({
          userId: dto.recipientId,
          title: '❤️ Coupon Received',
          body: `${sender?.name || 'Someone'} gifted you ${dto.quantity} coupon(s)!`,
        })
        .catch((err) =>
          this.logger.error(`Push to recipient failed: ${err.message}`),
        );

      // Appreciation Wall entry (if both have public recognition enabled)
      let appreciationWallEntry = null;
      if (sender?.publicRecognition && recipient.publicRecognition) {
        appreciationWallEntry = {
          message: `❤️ ${sender.name} gifted ${recipient.name} ${dto.quantity} coupon(s)!`,
          senderName: sender.name,
          recipientName: recipient.name,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: transfer.id,
        status: 'COMPLETED',
        senderRemainingBalance: senderCoupon.balance,
        recipientName: recipient.name,
        appreciationWallEntry,
        message: 'Transfer successful',
        createdAt: transfer.createdAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.transferRepository.findAndCount({
      where: [{ senderId: userId }, { recipientId: userId }],
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.senderId === userId ? 'SENT' : 'RECEIVED',
        counterpartyName:
          t.senderId === userId ? t.recipient?.name : t.sender?.name,
        couponTypeId: t.couponTypeId,
        quantity: t.quantity,
        appreciationMessage: t.appreciationMessage,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getAppreciationWall(page = 1, limit = 10) {
    const [items, total] = await this.transferRepository.findAndCount({
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const wallEntries = items
      .filter(
        (t) => t.sender?.publicRecognition && t.recipient?.publicRecognition,
      )
      .map((t) => ({
        message: `❤️ ${t.sender.name} gifted ${t.recipient.name} ${t.quantity} coupon(s)!`,
        appreciationMessage: t.appreciationMessage,
        timestamp: t.createdAt,
      }));

    return { items: wallEntries, total };
  }
}
