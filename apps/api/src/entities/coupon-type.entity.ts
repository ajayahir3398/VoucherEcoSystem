import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coupon_types')
export class CouponTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  co2ePerServing!: number;

  @Column({ type: 'int' })
  ecoPointsModifier!: number;

  @Column({ default: true })
  isActive!: boolean;
}
