import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employeeId' })
  employee!: User;

  @Column({ nullable: true })
  sellerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller?: User;

  @Column({
    type: 'enum',
    enum: [
      'ISSUANCE',
      'REDEMPTION',
      'TRANSFER_DEBIT',
      'TRANSFER_CREDIT',
      'REFUND',
      'EXPIRY',
    ],
  })
  type!: string;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ nullable: true })
  refNonce?: string;

  @Column({ nullable: true })
  couponType?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
