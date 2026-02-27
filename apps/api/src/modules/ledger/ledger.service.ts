import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import {
  LedgerEntry,
  EmployeeCoupon,
  CouponTypeEntity,
  User,
} from '../../entities';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(EmployeeCoupon)
    private readonly employeeCouponRepository: Repository<EmployeeCoupon>,
    @InjectRepository(CouponTypeEntity)
    private readonly couponTypeRepository: Repository<CouponTypeEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) { }

  async getEmployeeLedger(
    employeeId: string,
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
  ) {
    const queryBuilder = this.ledgerEntryRepository
      .createQueryBuilder('le')
      .where('le.employeeId = :employeeId', { employeeId })
      .orderBy('le.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (startDate && endDate) {
      queryBuilder.andWhere('le.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, limit };
  }

  async getAllLedgerEntries(
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
    type?: string,
  ) {
    const queryBuilder = this.ledgerEntryRepository
      .createQueryBuilder('le')
      .leftJoinAndSelect('le.employee', 'employee')
      .leftJoinAndSelect('le.seller', 'seller')
      .orderBy('le.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (startDate && endDate) {
      queryBuilder.andWhere('le.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    if (type) {
      queryBuilder.andWhere('le.type = :type', { type });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(item => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employee?.name,
        sellerId: item.sellerId,
        sellerName: item.seller?.name,
        type: item.type,
        amount: item.amount,
        quantity: item.quantity,
        refNonce: item.refNonce,
        createdAt: item.createdAt,
      })),
      total,
      page,
      limit
    };
  }

  async getBalance(employeeId: string) {
    const coupons = await this.employeeCouponRepository.find({
      where: { employeeId },
      relations: ['couponType'],
    });

    return coupons.map((coupon) => ({
      couponTypeId: coupon.couponTypeId,
      couponTypeName: coupon.couponType?.name || 'Unknown',
      balance: coupon.balance,
      ecoPointsModifier: coupon.couponType?.ecoPointsModifier || 0,
      lastUpdated: coupon.lastUpdated,
    }));
  }

  async issueCoupons(dto: {
    employeeId: string;
    couponTypeId: string;
    amount: number;
    issuedBy: string;
  }) {
    // Verify employee exists
    const employee = await this.userRepository.findOne({
      where: { id: dto.employeeId, role: 'EMPLOYEE' },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Verify coupon type exists
    const couponType = await this.couponTypeRepository.findOne({
      where: { id: dto.couponTypeId },
    });
    if (!couponType) {
      throw new BadRequestException('Coupon type not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find or create employee coupon balance
      let coupon = await queryRunner.manager.findOne(EmployeeCoupon, {
        where: { employeeId: dto.employeeId, couponTypeId: dto.couponTypeId },
      });

      if (!coupon) {
        coupon = queryRunner.manager.create(EmployeeCoupon, {
          employeeId: dto.employeeId,
          couponTypeId: dto.couponTypeId,
          balance: 0,
        });
      }

      coupon.balance += dto.amount;
      await queryRunner.manager.save(coupon);

      // Create ledger entry
      const ledgerEntry = queryRunner.manager.create(LedgerEntry, {
        employeeId: dto.employeeId,
        type: 'ISSUANCE',
        amount: dto.amount,
      });
      await queryRunner.manager.save(ledgerEntry);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Issued ${dto.amount} ${couponType.name} coupons to employee ${dto.employeeId}`,
      );

      return {
        employeeId: dto.employeeId,
        couponTypeId: dto.couponTypeId,
        couponTypeName: couponType.name,
        amountIssued: dto.amount,
        newBalance: coupon.balance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkIssueCoupons(
    items: { employeeId: string; couponTypeId: string; amount: number }[],
    issuedBy: string,
  ) {
    const results = [];
    for (const item of items) {
      try {
        const result = await this.issueCoupons({
          ...item,
          issuedBy,
        });
        results.push({ ...result, status: 'SUCCESS' });
      } catch (error: any) {
        results.push({
          employeeId: item.employeeId,
          couponTypeId: item.couponTypeId,
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    return {
      totalProcessed: results.length,
      successful: results.filter((r) => r.status === 'SUCCESS').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      results,
    };
  }

  async getCouponTypes() {
    return this.couponTypeRepository.find({ where: { isActive: true } });
  }
}
