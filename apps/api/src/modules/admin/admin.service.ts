import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
    User,
    SystemConfig,
    AuditLog,
    EmployeeCoupon,
    LedgerEntry,
    CouponTypeEntity,
    SyncConflict
} from '../../entities';
import { BulkIssueDto, CreateUserDto, UpdateUserDto, UpdateConfigDto, CreateCouponDto, UpdateCouponDto } from './dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(SystemConfig) private configRepository: Repository<SystemConfig>,
        @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>,
        @InjectRepository(CouponTypeEntity) private couponTypeRepository: Repository<CouponTypeEntity>,
        @InjectRepository(LedgerEntry) private ledgerRepository: Repository<LedgerEntry>,
        @InjectRepository(SyncConflict) private syncConflictRepository: Repository<SyncConflict>,
        private dataSource: DataSource,
    ) { }

    private async logAction(adminId: string, action: string, entity: string, entityId: string | null = null, details: any = null) {
        await this.auditLogRepository.save({
            adminId,
            action,
            entity,
            entityId,
            details,
        });
    }

    async bulkIssueCoupons(dto: BulkIssueDto, adminId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let totalIssued = 0;
            for (const item of dto.items) {
                const user = await queryRunner.manager.findOne(User, {
                    where: { id: item.employeeId, role: 'EMPLOYEE' }
                });
                if (!user) {
                    throw new BadRequestException(`Employee not found: ${item.employeeId}`);
                }

                // Validate coupon type ID format before queries to avoid 500 PG cast errors
                if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.couponTypeId)) {
                    throw new BadRequestException(`Invalid Coupon Type ID: ${item.couponTypeId}`);
                }

                const couponType = await queryRunner.manager.findOne(CouponTypeEntity, { where: { id: item.couponTypeId } });
                if (!couponType) {
                    throw new BadRequestException(`Coupon type not found: ${item.couponTypeId}`);
                }

                // Update balance
                let empCoupon = await queryRunner.manager.findOne(EmployeeCoupon, {
                    where: { employeeId: user.id, couponTypeId: item.couponTypeId },
                });

                if (!empCoupon) {
                    empCoupon = queryRunner.manager.create(EmployeeCoupon, {
                        employeeId: user.id,
                        couponTypeId: item.couponTypeId,
                        balance: item.quantity,
                    });
                } else {
                    empCoupon.balance += item.quantity;
                }
                await queryRunner.manager.save(empCoupon);

                // Record ledger entry
                const couponAmount = couponType?.amount ? Number(couponType.amount) : 0;
                const ledgerEntry = queryRunner.manager.create(LedgerEntry, {
                    employeeId: user.id,
                    type: 'ISSUANCE',
                    amount: couponAmount * item.quantity,
                    quantity: item.quantity,
                    couponType: couponType.name,
                    // note: refNonce is null for manual admin issuance
                });
                await queryRunner.manager.save(ledgerEntry);

                totalIssued += item.quantity;
            }

            await queryRunner.commitTransaction();

            // Log action
            await this.logAction(adminId, 'BULK_ISSUE', 'EmployeeCoupon', null, { itemsCount: dto.items.length, totalIssued });

            return { success: true, totalIssued };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getDashboardStats() {
        const totalUsers = await this.userRepository.count();
        const activeSellers = await this.userRepository.count({ where: { role: 'SELLER', isActive: true } });

        // Get today's redemptions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const redemptionsQuery = await this.ledgerRepository.createQueryBuilder('ledger')
            .where('ledger.type = :type', { type: 'REDEMPTION' })
            .andWhere('ledger.createdAt >= :today', { today })
            .select('SUM(ledger.amount)', 'sum')
            .getRawOne();

        const todaysRedemptions = redemptionsQuery.sum ? parseInt(redemptionsQuery.sum) : 0;

        // Calculate pending syncs from audit log or sync queue (mocked as 0 for now as sync queue is not in this domain context)
        const pendingSyncs = 0;

        return {
            totalUsers,
            activeSellers,
            todaysRedemptions,
            pendingSyncs
        };
    }

    async getUsers(role?: string, page: number = 1, limit: number = 20) {
        const query = this.userRepository.createQueryBuilder('user')
            .select(['user.id', 'user.email', 'user.name', 'user.role', 'user.isActive', 'user.createdAt']);

        if (role) {
            query.where('user.role = :role', { role });
        }

        query.skip((page - 1) * limit).take(limit).orderBy('user.createdAt', 'DESC');

        const [items, total] = await query.getManyAndCount();
        return { items, total, page, limit };
    }

    async createUser(dto: CreateUserDto, adminId: string) {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new BadRequestException('Email already in use');
        }

        const user = this.userRepository.create({
            email: dto.email,
            name: dto.name,
            role: dto.role
        });

        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }

        await this.userRepository.save(user);

        await this.logAction(adminId, 'CREATE_USER', 'User', user.id, { role: dto.role, email: dto.email });

        // omit password from response
        delete (user as any).password;
        return user;
    }

    async updateUser(id: string, dto: UpdateUserDto, adminId: string) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        if (dto.name) user.name = dto.name;
        if (dto.status !== undefined) {
            user.isActive = dto.status === 'active';
        }

        await this.userRepository.save(user);

        await this.logAction(adminId, 'UPDATE_USER', 'User', user.id, dto);

        delete (user as any).password;
        return user;
    }

    async getConfig() {
        return this.configRepository.find({ order: { key: 'ASC' } });
    }

    async updateConfig(dto: UpdateConfigDto, adminId: string) {
        let config = await this.configRepository.findOne({ where: { key: dto.key } });
        if (!config) {
            config = this.configRepository.create({ key: dto.key });
        }

        const oldValues = config.id ? { value: config.value, description: config.description } : null;

        config.value = dto.value;
        if (dto.description !== undefined) config.description = dto.description;

        await this.configRepository.save(config);

        await this.logAction(adminId, 'UPDATE_CONFIG', 'SystemConfig', config.id, {
            key: dto.key,
            old: oldValues,
            new: dto.value
        });

        return config;
    }

    async getAuditLogs(page: number = 1, limit: number = 20) {
        const [items, total] = await this.auditLogRepository.findAndCount({
            relations: ['admin'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                admin: {
                    id: true,
                    email: true,
                    name: true,
                }
            }
        });

        return { items, total, page, limit };
    }

    // --- Coupon Management ---

    async getCoupons() {
        return this.couponTypeRepository.find({ order: { name: 'ASC' } });
    }

    async getCoupon(id: string) {
        const coupon = await this.couponTypeRepository.findOne({ where: { id } });
        if (!coupon) throw new NotFoundException('Coupon not found');
        return coupon;
    }

    async createCoupon(dto: CreateCouponDto, adminId: string) {
        const coupon = this.couponTypeRepository.create(dto);
        await this.couponTypeRepository.save(coupon);
        await this.logAction(adminId, 'CREATE_COUPON', 'CouponTypeEntity', coupon.id, dto);
        return coupon;
    }

    async updateCoupon(id: string, dto: UpdateCouponDto, adminId: string) {
        const coupon = await this.couponTypeRepository.findOne({ where: { id } });
        if (!coupon) throw new NotFoundException('Coupon not found');

        if (dto.name) coupon.name = dto.name;
        if (dto.description) coupon.description = dto.description;
        if (dto.amount !== undefined) coupon.amount = dto.amount;
        if (dto.co2ePerServing !== undefined) coupon.co2ePerServing = dto.co2ePerServing;
        if (dto.ecoPointsModifier !== undefined) coupon.ecoPointsModifier = dto.ecoPointsModifier;
        if (dto.isActive !== undefined) coupon.isActive = dto.isActive;

        await this.couponTypeRepository.save(coupon);
        await this.logAction(adminId, 'UPDATE_COUPON', 'CouponTypeEntity', coupon.id, dto);
        return coupon;
    }

    async deleteCoupon(id: string, adminId: string) {
        const coupon = await this.couponTypeRepository.findOne({ where: { id } });
        if (!coupon) throw new NotFoundException('Coupon not found');

        // Note: Make sure there are no foreign key constraints violated if EmployeeCoupons reference this. 
        // In reality, you might soft delete this or check for active issued coupons first.
        await this.couponTypeRepository.remove(coupon);
        await this.logAction(adminId, 'DELETE_COUPON', 'CouponTypeEntity', id, { name: coupon.name });
        return { success: true };
    }

    // --- Sync Conflict Management ---

    async getSyncConflicts(page: number = 1, limit: number = 20) {
        const [items, total] = await this.syncConflictRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total, page, limit };
    }

    async resolveSyncConflict(conflictId: string, resolution: any, adminId: string) {
        const conflict = await this.syncConflictRepository.findOne({ where: { id: conflictId } });
        if (!conflict) throw new NotFoundException('Sync conflict not found');

        conflict.resolved = true;
        conflict.resolution = resolution.note || 'Resolved by Admin';
        conflict.resolvedBy = adminId;
        conflict.resolvedAt = new Date();

        await this.syncConflictRepository.save(conflict);

        await this.logAction(adminId, 'RESOLVE_SYNC_CONFLICT', 'SyncConflict', conflict.id, resolution);

        return conflict;
    }
}
