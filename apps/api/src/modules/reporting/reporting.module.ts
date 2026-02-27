import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Redemption,
  LedgerEntry,
  SyncConflict,
  User,
  SellerNonce,
  Transfer,
} from '../../entities';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Redemption,
      LedgerEntry,
      SyncConflict,
      User,
      SellerNonce,
      Transfer,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
