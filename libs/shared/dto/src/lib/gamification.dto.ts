import { IsBoolean, IsString, IsUUID } from 'class-validator';

export class AddEcoPointsDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  beverageType!: string;

  @IsBoolean()
  reusableCup!: boolean;
}

export class GamificationStatsResponseDto {
  engagementPoints!: number;
  ecoPoints!: number;
  currentStreak!: number;
  longestStreak!: number;
  badges!: { name: string; description: string; earnedAt: Date }[];
  leaderboardRank?: number;
}
