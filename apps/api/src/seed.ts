import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Database Seed Script for Digital Voucher Ecosystem
 *
 * Run via: npx ts-node -r tsconfig-paths/register apps/api/src/seed.ts
 *
 * Note: This script connects directly to the database using the environment
 * variables from apps/api/.env. It creates demo data for development/testing.
 */

async function seed() {
  // Load env manually
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.join(__dirname, '../.env') });

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'digital_voucher',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log('✅ Connected to database');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ─── 1. Create Coupon Types ────────────────────────────────────────
    console.log('📦 Seeding coupon types...');
    const couponTypes = await queryRunner.query(`
      INSERT INTO coupon_types (id, name, description, "co2ePerServing", "ecoPointsModifier", "isActive")
      VALUES 
        (gen_random_uuid(), 'TEA', 'Tea coupon', 0.05, 12, true),
        (gen_random_uuid(), 'COFFEE', 'Coffee coupon', 0.21, 0, true),
        (gen_random_uuid(), 'SNACK', 'Snack coupon', 0.15, 5, true)
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);
    console.log('  Coupon types:', couponTypes);

    // ─── 2. Create Badge Definitions ───────────────────────────────────
    console.log('🏅 Seeding badges...');
    await queryRunner.query(`
      INSERT INTO badges (id, name, description, criteria)
      VALUES 
        (gen_random_uuid(), 'FIRST_REDEMPTION', 'First coupon redeemed', 'Complete your first redemption'),
        (gen_random_uuid(), 'EARLY_BIRD', 'Morning person', 'Redeem before 8:30 AM'),
        (gen_random_uuid(), 'COFFEE_ADDICT', 'Coffee lover', '30-day consecutive redemption streak'),
        (gen_random_uuid(), 'SUSTAINABILITY_CHAMPION', 'Eco warrior', 'Earn 500+ eco-points'),
        (gen_random_uuid(), 'APPRECIATION_STAR', 'Generous spirit', 'Earn 300+ engagement points'),
        (gen_random_uuid(), 'STREAK_MASTER', 'Consistency king', '60-day longest streak')
      ON CONFLICT DO NOTHING;
    `);

    // ─── 3. Create Demo Users ──────────────────────────────────────────
    console.log('👤 Seeding demo users...');

    // Admin
    const [admin] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'admin@company.com', 'Admin User', $1, 'ADMIN', 'IT', true, false)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    // Sellers
    const [seller1] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'chai.wala@company.com', 'Chai Wala', $1, 'SELLER', null, true, false)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    const [seller2] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'coffee.shop@company.com', 'Coffee Corner', $1, 'SELLER', null, true, false)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    // Employees
    const [emp1] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'rahul@company.com', 'Rahul Sharma', $1, 'EMPLOYEE', 'Engineering', true, true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    const [emp2] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'priya@company.com', 'Priya Patel', $1, 'EMPLOYEE', 'Marketing', true, true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    const [emp3] = await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'arjun@company.com', 'Arjun Mehta', $1, 'EMPLOYEE', 'Engineering', true, true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `,
      [hashedPassword],
    );

    // Finance user
    await queryRunner.query(
      `
      INSERT INTO users (id, email, name, password, role, department, "isActive", "publicRecognition")
      VALUES (gen_random_uuid(), 'finance@company.com', 'Finance User', $1, 'FINANCE', 'Finance', true, false)
      ON CONFLICT (email) DO NOTHING;
    `,
      [hashedPassword],
    );

    // ─── 4. Assign initial coupon balances ─────────────────────────────
    console.log('🎫 Seeding coupon balances...');
    if (emp1 && couponTypes.length > 0) {
      for (const ct of couponTypes) {
        for (const emp of [emp1, emp2, emp3].filter(Boolean)) {
          await queryRunner.query(
            `
            INSERT INTO employee_coupons ("employeeId", "couponTypeId", balance)
            VALUES ($1, $2, $3)
            ON CONFLICT ("employeeId", "couponTypeId") DO UPDATE SET balance = $3;
          `,
            [emp.id, ct.id, 20],
          );

          // Create issuance ledger entry
          await queryRunner.query(
            `
            INSERT INTO ledger_entries (id, "employeeId", type, amount, "createdAt")
            VALUES (gen_random_uuid(), $1, 'ISSUANCE', $2, NOW());
          `,
            [emp.id, 20],
          );
        }
      }
    }

    // ─── 5. Create System Configs ──────────────────────────────────────
    console.log('⚙️ Seeding system configs...');
    await queryRunner.query(`
      INSERT INTO system_configs (id, key, value, description, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'MAX_DAILY_REDEMPTIONS', '"120"', 'Maximum redemptions per vendor per minute', NOW(), NOW()),
        (gen_random_uuid(), 'QR_REFRESH_INTERVAL', '"10"', 'Minutes before a Seller QR expires', NOW(), NOW()),
        (gen_random_uuid(), 'ALLOW_P2P_TRANSFERS', '"true"', 'Enable peer-to-peer coupon gifting', NOW(), NOW()),
        (gen_random_uuid(), 'OFFLINE_SYNC_LIMIT', '"50"', 'Max items in offline sync queue', NOW(), NOW())
      ON CONFLICT (key) DO NOTHING;
    `);

    await queryRunner.commitTransaction();
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Demo credentials (all use password: password123):');
    console.log('  Admin:    admin@company.com');
    console.log('  Finance:  finance@company.com');
    console.log('  Seller 1: chai.wala@company.com');
    console.log('  Seller 2: coffee.shop@company.com');
    console.log('  Employee 1: rahul@company.com');
    console.log('  Employee 2: priya@company.com');
    console.log('  Employee 3: arjun@company.com');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', error);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed();
