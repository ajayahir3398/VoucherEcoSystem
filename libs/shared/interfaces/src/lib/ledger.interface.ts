import { LedgerEntryType } from '@digital-voucher-ecosystem/shared-constants';

export interface ILedgerEntry {
  id: string;
  employeeId: string;
  sellerId?: string;
  type: LedgerEntryType;
  amount: number;
  refNonce?: string;
  createdAt: Date;
}
