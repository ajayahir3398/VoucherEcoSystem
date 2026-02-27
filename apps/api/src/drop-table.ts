import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

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
} from './entities';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
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
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
    await AppDataSource.initialize();
    console.log('Connected to database');

    await AppDataSource.query(`DROP TABLE IF EXISTS "coupon_types" CASCADE;`);
    console.log('Dropped table coupon_types');

    await AppDataSource.destroy();
}

run().catch(console.error);
