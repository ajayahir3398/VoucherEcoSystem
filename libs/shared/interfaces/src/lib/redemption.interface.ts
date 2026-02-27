import { TransactionStatus } from '@digital-voucher-ecosystem/shared-constants';

export interface IRedemption {
  id: string;
  employeeId: string;
  sellerId: string;
  couponTypeId: string;
  quantity: number;
  nonce: string;
  deviceSignature: string;
  idempotencyKey: string;
  status: TransactionStatus;
  createdAt: Date;
}
