export interface ISellerNonce {
  id: string;
  sellerId: string;
  nonce: string;
  hmacSignature: string;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
}
