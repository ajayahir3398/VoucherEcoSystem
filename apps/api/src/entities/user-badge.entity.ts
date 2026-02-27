import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryColumn()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @PrimaryColumn()
  badgeId!: string;

  @ManyToOne(() => Badge)
  @JoinColumn({ name: 'badgeId' })
  badge!: Badge;

  @CreateDateColumn()
  earnedAt!: Date;
}
