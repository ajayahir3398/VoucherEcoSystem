import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  department: string;
  engagementPoints: number;
  ecoPoints: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt?: string;
  criteria: string;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastRedemptionDate: string | null;
  nextMilestone: number;
  daysToNextReward: number;
}

export interface CarbonLedgerEntry {
  id: string;
  type: string;
  title: string;
  points: number;
  co2Saved: number;
  timestamp: string;
}

export interface GamificationStats {
  totalPoints: number;
  carbonSavedKg: number;
  redemptionsCount: number;
  recentActivity: CarbonLedgerEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  constructor(private readonly apiService: ApiService) { }

  getStats(): Observable<GamificationStats> {
    return this.apiService.get<GamificationStats>('v1/gamification/stats');
  }

  getLeaderboard(limit = 10): Observable<LeaderboardEntry[]> {
    return this.apiService.get<LeaderboardEntry[]>('v1/gamification/leaderboard', { limit });
  }

  getBadges(): Observable<Badge[]> {
    return this.apiService.get<Badge[]>('v1/gamification/badges');
  }

  getStreak(): Observable<StreakStatus> {
    return this.apiService.get<StreakStatus>('v1/gamification/streak');
  }

  getCarbonLedger(page = 1, limit = 10): Observable<{ entries: CarbonLedgerEntry[], total: number }> {
    return this.apiService.get<{ entries: CarbonLedgerEntry[], total: number }>('v1/gamification/carbon-ledger', { page, limit });
  }
}
