import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerNonce, User, Redemption } from '../../entities';
import { SellerQrController } from './seller-qr.controller';
import { SellerQrService } from './seller-qr.service';

@Module({
  imports: [TypeOrmModule.forFeature([SellerNonce, User, Redemption])],
  controllers: [SellerQrController],
  providers: [SellerQrService],
  exports: [SellerQrService],
})
export class SellerQrModule { }
