import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, CouponTypeEntity, SystemConfig, AuditLog, EmployeeCoupon, LedgerEntry, SyncConflict } from '../../entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            CouponTypeEntity,
            SystemConfig,
            AuditLog,
            EmployeeCoupon,
            LedgerEntry,
            SyncConflict,
        ]),
    ],
    providers: [AdminService],
    controllers: [AdminController],
    exports: [AdminService],
})
export class AdminModule { }
