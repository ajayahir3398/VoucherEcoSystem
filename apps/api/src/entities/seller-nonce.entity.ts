import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('seller_nonces')
export class SellerNonce {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sellerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ type: 'uuid', unique: true })
  nonce!: string;

  @Column()
  hmacSignature!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ default: false })
  consumed!: boolean;

  @Column({ nullable: true })
  otp?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
