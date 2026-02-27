import { CouponType } from '@digital-voucher-ecosystem/shared-constants';

export interface ICouponType {
  id: string;
  name: CouponType;
  description: string;
  co2ePerServing: number;
  ecoPointsModifier: number;
  isActive: boolean;
}

export interface IEmployeeCoupon {
  employeeId: string;
  couponTypeId: string;
  balance: number;
  lastUpdated: Date;
}
