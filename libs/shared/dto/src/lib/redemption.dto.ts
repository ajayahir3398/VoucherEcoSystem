import { IsString, IsUUID, IsNumber, Min, IsISO8601 } from 'class-validator';

export class CreateRedemptionDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  sellerUUID!: string;

  @IsString()
  nonce!: string;

  @IsUUID()
  couponTypeId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsISO8601()
  timestamp!: string;

  @IsString()
  deviceSignature!: string;

  @IsString()
  idempotencyKey!: string;
}

export class RedemptionResponseDto {
  id!: string;
  status!: string;
  remainingBalance!: number;
  message!: string;
  createdAt!: Date;
}
