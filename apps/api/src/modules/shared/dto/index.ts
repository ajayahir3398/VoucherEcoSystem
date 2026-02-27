import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsISO8601,
  IsOptional,
  IsBoolean,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRedemptionDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee UUID',
  })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'Seller UUID (from QR code)',
  })
  @IsUUID()
  sellerUUID!: string;

  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    description: 'Server-signed nonce from Seller QR',
  })
  @IsString()
  nonce!: string;

  @ApiProperty({
    example: '880e8400-e29b-41d4-a716-446655440003',
    description: 'Coupon type UUID',
  })
  @IsUUID()
  couponTypeId!: string;

  @ApiProperty({
    example: 1,
    description: 'Number of coupons to redeem',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    example: '2026-02-24T10:30:00.000Z',
    description: 'Client-side timestamp',
  })
  @IsISO8601()
  timestamp!: string;

  @ApiProperty({
    example: 'sig_abc123',
    description: 'Device-signed payload signature',
  })
  @IsString()
  deviceSignature!: string;

  @ApiProperty({
    example: 'idem_xyz789',
    description:
      'Client-generated idempotency key (prevents duplicate submissions)',
  })
  @IsString()
  idempotencyKey!: string;
}

export class CreateTransferDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Sender employee UUID',
  })
  @IsUUID()
  senderId!: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'Recipient employee UUID',
  })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    description: 'Nonce from recipient QR scan',
  })
  @IsString()
  nonce!: string;

  @ApiProperty({
    example: '880e8400-e29b-41d4-a716-446655440003',
    description: 'Coupon type UUID',
  })
  @IsUUID()
  couponTypeId!: string;

  @ApiProperty({
    example: 2,
    description: 'Number of coupons to transfer',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'sig_device123', description: 'Device signature' })
  @IsString()
  deviceSignature!: string;

  @ApiPropertyOptional({
    example: 'Thanks for the help! ☕',
    description: 'Appreciation message (shown on wall)',
  })
  @IsString()
  @IsOptional()
  appreciationMessage?: string;
}

export class IssueCouponDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee UUID to issue coupons to',
  })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({
    example: '880e8400-e29b-41d4-a716-446655440003',
    description: 'Coupon type UUID',
  })
  @IsUUID()
  couponTypeId!: string;

  @ApiProperty({
    example: 20,
    description: 'Number of coupons to issue',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    example: 'admin-uuid',
    description: 'Admin user who issued the coupons',
  })
  @IsUUID()
  @IsOptional()
  issuedBy!: string;
}

export class BulkIssueCouponDto {
  @ApiProperty({
    type: [IssueCouponDto],
    description: 'Array of coupon issuance entries',
  })
  @ValidateNested({ each: true })
  @Type(() => IssueCouponDto)
  items!: IssueCouponDto[];

  @ApiProperty({
    example: 'admin-uuid',
    description: 'Admin user who issued the coupons',
  })
  @IsUUID()
  issuedBy!: string;
}

export class EcoPointsDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee UUID',
  })
  @IsUUID()
  employeeId!: string;

  @ApiProperty({
    example: 'GREEN_TEA',
    description: 'Beverage type (BLACK_COFFEE, DAIRY_MILK, OAT_SOY, GREEN_TEA)',
  })
  @IsString()
  beverageType!: string;

  @ApiProperty({
    example: true,
    description: 'Whether employee used a reusable cup (+15 eco-points)',
  })
  @IsBoolean()
  reusableCup!: boolean;
}

export class PushNotificationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Target user UUID',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    example: '☕ Coupon Redeemed',
    description: 'Notification title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: '1 coupon redeemed at Chai Wala',
    description: 'Notification body',
  })
  @IsString()
  body!: string;
}

export class PushSubscribeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/...',
    description: 'Web Push endpoint URL',
  })
  @IsString()
  endpoint!: string;

  @ApiProperty({
    description: 'Push subscription keys',
    example: { p256dh: 'key1...', auth: 'key2...' },
  })
  @IsOptional()
  keys!: { p256dh: string; auth: string };
}

export class UnsubscribeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User UUID',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/...',
    description: 'Web Push endpoint URL',
  })
  @IsString()
  endpoint!: string;
}
