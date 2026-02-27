import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Redemption,
  EmployeeCoupon,
  SellerNonce,
  LedgerEntry,
  User,
} from '../../entities';
import { RedemptionController } from './redemption.controller';
import { RedemptionService } from './redemption.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Redemption,
      EmployeeCoupon,
      SellerNonce,
      LedgerEntry,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [RedemptionController],
  providers: [RedemptionService],
  exports: [RedemptionService],
})
export class RedemptionModule {}
