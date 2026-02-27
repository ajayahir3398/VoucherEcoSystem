import { BadgeType } from '@digital-voucher-ecosystem/shared-constants';

export interface IBadge {
  id: string;
  name: BadgeType;
  description: string;
  criteria: string;
}

export interface IUserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

export interface IGamificationStats {
  engagementPoints: number;
  ecoPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: IBadge[];
  leaderboardRank?: number;
}
