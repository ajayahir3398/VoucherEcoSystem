import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CouponTypeEntity } from './coupon-type.entity';

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employeeId' })
  employee!: User;

  @Column()
  sellerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ nullable: true })
  couponTypeId?: string;

  @ManyToOne(() => CouponTypeEntity)
  @JoinColumn({ name: 'couponTypeId' })
  couponType!: CouponTypeEntity;

  @Column({ type: 'int' })
  quantity!: number;

  @Column()
  nonce!: string;

  @Column()
  deviceSignature!: string;

  @Column({ nullable: true })
  idempotencyKey?: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'CONFLICT'],
    default: 'PENDING',
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
