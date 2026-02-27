import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge, UserBadge, User, CouponTypeEntity, Redemption, LedgerEntry } from '../../entities';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Badge,
      UserBadge,
      User,
      CouponTypeEntity,
      Redemption,
      LedgerEntry,
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule { }
