import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SellerNonce, User, Redemption } from '../../entities';
import { randomUUID, createHmac } from 'crypto';

@Injectable()
export class SellerQrService {
  private readonly logger = new Logger(SellerQrService.name);
  private readonly hmacSecret: string;

  constructor(
    @InjectRepository(SellerNonce)
    private readonly sellerNonceRepository: Repository<SellerNonce>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    private readonly configService: ConfigService,
  ) {
    this.hmacSecret = this.configService.get<string>(
      'SELLER_QR_HMAC_SECRET',
      'change-this-seller-qr-secret',
    );
  }

  async generateQrPayload(sellerId: string) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: 'SELLER' },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check for existing valid (non-expired, non-consumed) nonce
    const existingNonce = await this.sellerNonceRepository.findOne({
      where: { sellerId, consumed: false },
      order: { createdAt: 'DESC' },
    });

    if (existingNonce && existingNonce.expiresAt > new Date()) {
      return {
        sellerUUID: sellerId,
        nonce: existingNonce.nonce,
        hmacSignature: existingNonce.hmacSignature,
        timestamp: existingNonce.createdAt.toISOString(),
        expiresAt: existingNonce.expiresAt.toISOString(),
        otp: existingNonce.otp,
        sellerName: seller.name,
        sellerPhoto: seller.photo,
      };
    }

    // Generate new nonce
    return this.createNewNonce(sellerId, seller);
  }

  async refreshQrPayload(sellerId: string) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: 'SELLER' },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    this.logger.log(`QR refresh requested for seller: ${sellerId}`);
    return this.createNewNonce(sellerId, seller);
  }

  async getSellerInfo(sellerId: string) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: 'SELLER' },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return {
      id: seller.id,
      name: seller.name,
      photo: seller.photo,
    };
  }

  async getSellerFeed(sellerId: string, limit = 20) {
    const redemptions = await this.redemptionRepository.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['employee', 'couponType'],
    });

    return redemptions.map((r) => ({
      id: r.id,
      couponName: r.couponType?.name || 'Unknown Coupon',
      employeeName: r.employee?.name || 'Unknown Employee',
      employeeEmail: r.employee?.email || '',
      amount: r.quantity,
      createdAt: r.createdAt.toISOString(),
      ecoPointsEarned: 10 * r.quantity, // Placeholder logic
    }));
  }

  async getSellerSummary(sellerId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const redemptions = await this.redemptionRepository.find({
      where: {
        sellerId,
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['couponType'],
    });

    const totalCount = redemptions.reduce((sum, r) => sum + r.quantity, 0);
    const totalAmount = redemptions.reduce((sum, r) => {
      const amount = r.couponType?.amount ? Number(r.couponType.amount) : 0;
      return sum + (amount * r.quantity);
    }, 0);
    const totalCo2Saved = redemptions.reduce((sum, r) => {
      const co2 = r.couponType?.co2ePerServing ? Number(r.couponType.co2ePerServing) : 0;
      return sum + (co2 * r.quantity);
    }, 0);

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalCount,
      totalAmount,
      totalCo2Saved,
      transactionCount: redemptions.length,
    };
  }

  private async createNewNonce(sellerId: string, seller: User) {
    const nonce = randomUUID();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const hmacSignature = createHmac('sha256', this.hmacSecret)
      .update(`${sellerId}:${nonce}:${expiresAt.toISOString()}`)
      .digest('hex');

    const sellerNonce = this.sellerNonceRepository.create({
      sellerId,
      nonce,
      otp,
      hmacSignature,
      expiresAt,
    });
    await this.sellerNonceRepository.save(sellerNonce);

    this.logger.log(
      `New QR nonce generated for seller ${sellerId}, expires at ${expiresAt.toISOString()}`,
    );

    return {
      sellerUUID: sellerId,
      nonce,
      otp,
      hmacSignature,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      sellerName: seller.name,
      sellerPhoto: seller.photo,
    };
  }
}
