import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LedgerEntry,
  EmployeeCoupon,
  CouponTypeEntity,
  User,
} from '../../entities';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      EmployeeCoupon,
      CouponTypeEntity,
      User,
    ]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
