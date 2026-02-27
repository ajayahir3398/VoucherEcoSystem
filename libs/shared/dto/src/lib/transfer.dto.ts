import { IsString, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  senderId!: string;

  @IsUUID()
  recipientId!: string;

  @IsString()
  nonce!: string;

  @IsUUID()
  couponTypeId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  deviceSignature!: string;

  @IsOptional()
  @IsString()
  appreciationMessage?: string;
}

export class TransferResponseDto {
  id!: string;
  status!: string;
  senderRemainingBalance!: number;
  recipientName!: string;
  message!: string;
  createdAt!: Date;
}
