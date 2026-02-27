import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CouponTypeEntity } from './coupon-type.entity';

@Entity('employee_coupons')
export class EmployeeCoupon {
  @PrimaryColumn()
  employeeId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employeeId' })
  employee!: User;

  @PrimaryColumn()
  couponTypeId!: string;

  @ManyToOne(() => CouponTypeEntity)
  @JoinColumn({ name: 'couponTypeId' })
  couponType!: CouponTypeEntity;

  @Column({ type: 'int', default: 0 })
  balance!: number;

  @UpdateDateColumn()
  lastUpdated!: Date;
}
