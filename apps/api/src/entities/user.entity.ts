import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: ['EMPLOYEE', 'SELLER', 'ADMIN', 'FINANCE'] })
  role!: string;

  @Column({ nullable: true })
  photo?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  deviceFingerprint?: string;

  @Column({ type: 'int', default: 0 })
  engagementPoints!: number;

  @Column({ type: 'int', default: 0 })
  ecoPoints!: number;

  @Column({ type: 'int', default: 0 })
  currentStreak!: number;

  @Column({ type: 'int', default: 0 })
  longestStreak!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRedemptionDate?: Date;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  publicRecognition!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
