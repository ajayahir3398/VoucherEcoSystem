export interface ITransfer {
  id: string;
  senderId: string;
  recipientId: string;
  couponTypeId: string;
  quantity: number;
  appreciationMessage?: string;
  createdAt: Date;
}
