import { UserRole } from '@digital-voucher-ecosystem/shared-constants';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photo?: string;
  deviceFingerprint?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
