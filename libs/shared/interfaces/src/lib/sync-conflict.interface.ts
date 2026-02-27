export interface ISyncConflict {
  id: string;
  sellerId: string;
  localTxnId: string;
  conflictReason: string;
  resolved: boolean;
  createdAt: Date;
}
