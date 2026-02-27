import { NotificationType } from '@digital-voucher-ecosystem/shared-constants';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}
