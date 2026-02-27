import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transfer, EmployeeCoupon, LedgerEntry, User } from '../../entities';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, EmployeeCoupon, LedgerEntry, User]),
    NotificationModule,
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
