import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { AuthModule } from '../modules/auth/auth.module';
import { RedemptionModule } from '../modules/redemption/redemption.module';
import { TransferModule } from '../modules/transfer/transfer.module';
import { SellerQrModule } from '../modules/seller-qr/seller-qr.module';
import { LedgerModule } from '../modules/ledger/ledger.module';
import { GamificationModule } from '../modules/gamification/gamification.module';
import { ReportingModule } from '../modules/reporting/reporting.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { AdminModule } from '../modules/admin/admin.module';

// Entities
import {
  User,
  SellerNonce,
  CouponTypeEntity,
  EmployeeCoupon,
  LedgerEntry,
  Redemption,
  Transfer,
  SyncConflict,
  Badge,
  UserBadge,
  PushSubscription,
  SystemConfig,
  AuditLog,
} from '../entities';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'digital_voucher'),
        entities: [
          User,
          SellerNonce,
          CouponTypeEntity,
          EmployeeCoupon,
          LedgerEntry,
          Redemption,
          Transfer,
          SyncConflict,
          Badge,
          UserBadge,
          PushSubscription,
          SystemConfig,
          AuditLog,
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
        ssl:
          configService.get('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // Feature modules
    AuthModule,
    RedemptionModule,
    TransferModule,
    SellerQrModule,
    LedgerModule,
    GamificationModule,
    ReportingModule,
    NotificationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule { }
