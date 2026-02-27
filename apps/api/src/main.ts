import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Swagger Configuration
  const port = process.env.PORT || 3000;
  const config = new DocumentBuilder()
    .setTitle('Digital Voucher Ecosystem API')
    .setDescription(
      `Backend API for the Digital Voucher Ecosystem v2.0.\n\n` +
        `**Key Features:**\n` +
        `- 🔐 JWT Authentication with device binding\n` +
        `- ☕ Coupon Redemption (Employee scans Seller QR)\n` +
        `- 🎁 P2P Coupon Transfer with Appreciation Wall\n` +
        `- 📊 Seller QR with HMAC-signed nonces (10-min TTL)\n` +
        `- 🏅 Gamification (Eco-Points, Streaks, Badges, Leaderboards)\n` +
        `- 📈 Reporting & Dashboards (Operational, Analytical, Strategic)\n` +
        `- 🔔 Web Push Notifications\n\n` +
        `**Demo Credentials** (password: \`password123\`):\n` +
        `- Admin: admin@company.com\n` +
        `- Seller: chai.wala@company.com\n` +
        `- Employee: rahul@company.com`,
    )
    .setVersion('2.0')
    .addServer(`http://localhost:${port}`, 'Local Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Auth', 'Authentication & user management')
    .addTag('Redemptions', 'Coupon redemption (Employee → Seller QR scan)')
    .addTag('Transfers', 'P2P coupon transfers & Appreciation Wall')
    .addTag('Seller QR', 'Seller QR code generation & nonce management')
    .addTag('Ledger', 'Coupon balances, ledger history & issuance')
    .addTag('Gamification', 'Eco-Points, streaks, badges & leaderboards')
    .addTag('Reports', 'EOD reconciliation, anomalies & dashboards')
    .addTag('Notifications', 'Web Push subscription & dispatch')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'Digital Voucher API Docs',
  });

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
