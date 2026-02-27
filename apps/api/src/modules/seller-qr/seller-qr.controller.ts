import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SellerQrService } from './seller-qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Seller QR')
@ApiBearerAuth('JWT')
@Controller('api/v1/seller')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerQrController {
  constructor(private readonly sellerQrService: SellerQrService) { }

  @Get('qr')
  @Roles('SELLER')
  @ApiOperation({
    summary: 'Get Seller QR payload',
    description:
      'Returns the QR code payload containing seller UUID, server-signed nonce (HMAC-SHA256), and 10-minute expiry. Reuses existing valid nonce if available.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR payload with nonce, HMAC signature, and expiry',
  })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getSellerQr(@CurrentUser('id') sellerId: string) {
    return this.sellerQrService.generateQrPayload(sellerId);
  }

  @Post('qr/refresh')
  @Roles('SELLER')
  @ApiOperation({
    summary: 'Force refresh Seller QR',
    description:
      'Generates a new nonce immediately, even if the current one has not expired.',
  })
  @ApiResponse({ status: 201, description: 'New QR payload generated' })
  async refreshQr(@CurrentUser('id') sellerId: string) {
    return this.sellerQrService.refreshQrPayload(sellerId);
  }

  @Get('info')
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({
    summary: 'Get seller info',
    description: 'Returns public seller information (name, photo).',
  })
  @ApiQuery({ name: 'sellerId', required: true, description: 'Seller UUID' })
  @ApiResponse({ status: 200, description: 'Seller public info' })
  async getSellerInfo(@Query('sellerId') sellerId: string) {
    return this.sellerQrService.getSellerInfo(sellerId);
  }

  @Get('feed')
  @Roles('SELLER')
  @ApiOperation({
    summary: 'Get seller transaction feed',
    description: 'Returns the most recent redemptions for the authenticated seller.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of recent transactions' })
  async getFeed(
    @CurrentUser('id') sellerId: string,
    @Query('limit') limit?: number,
  ) {
    return this.sellerQrService.getSellerFeed(sellerId, limit);
  }

  @Get('summary')
  @Roles('SELLER')
  @ApiOperation({
    summary: 'Get today\'s sales summary',
    description: 'Returns total counts, amounts, and CO2 savings for the current day.',
  })
  @ApiResponse({ status: 200, description: 'Daily summary statistics' })
  async getSummary(
    @CurrentUser('id') sellerId: string,
    @Query('date') date?: string,
  ) {
    return this.sellerQrService.getSellerSummary(sellerId, date);
  }
}
