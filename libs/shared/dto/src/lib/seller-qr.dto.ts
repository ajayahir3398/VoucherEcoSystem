import {
  IsString,
  IsUUID,
  IsNumber,
  IsISO8601,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class SellerQrPayloadDto {
  @IsUUID()
  sellerUUID!: string;

  @IsString()
  nonce!: string;

  @IsString()
  hmacSignature!: string;

  @IsISO8601()
  timestamp!: string;

  @IsISO8601()
  expiresAt!: string;

  @IsString()
  sellerName!: string;

  @IsOptional()
  @IsString()
  sellerPhoto?: string;
}

export class RefreshQrDto {
  @IsUUID()
  sellerId!: string;
}
