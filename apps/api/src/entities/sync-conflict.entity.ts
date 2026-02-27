import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sync_conflicts')
export class SyncConflict {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sellerId!: string;

  @Column()
  localTxnId!: string;

  @Column()
  conflictReason!: string;

  @Column({ default: false })
  resolved!: boolean;

  @Column({ nullable: true })
  resolution?: string;

  @Column({ nullable: true })
  resolvedBy?: string;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
