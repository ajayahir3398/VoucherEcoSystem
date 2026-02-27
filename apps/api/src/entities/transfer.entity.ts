import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  senderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column()
  recipientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @Column()
  couponTypeId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ nullable: true })
  appreciationMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
