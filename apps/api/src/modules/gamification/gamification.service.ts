import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Badge, UserBadge, User, CouponTypeEntity, Redemption, LedgerEntry } from '../../entities';

// CO₂e footprint constants per serving (kg CO₂e) from spec Section 10
const CARBON_FOOTPRINT: Record<string, number> = {
  COFFEE: 0.21,
  TEA: 0.05,
  SNACK: 0.15,
};

// Eco-points modifiers from spec Section 10
const ECO_POINTS_MODIFIERS: Record<string, number> = {
  BLACK_COFFEE: 0,
  DAIRY_MILK: -5,
  OAT_SOY: 10,
  GREEN_TEA: 12,
  REUSABLE_CUP: 15,
};

// Engagement point values from spec
const ENGAGEMENT_POINTS: Record<string, number> = {
  DAILY_APP_OPEN: 5,
  REDEMPTION: 10,
  TRANSFER: 15,
  PROFILE_COMPLETE: 25,
  REFERRAL: 50,
  STREAK_7: 30,
  STREAK_30: 100,
};

// Badge criteria
const BADGE_CRITERIA: Record<string, (user: User) => boolean> = {
  FIRST_REDEMPTION: (user: User) => user.engagementPoints >= 10,
  EARLY_BIRD: () => {
    const now = new Date();
    return (
      now.getHours() < 9 || (now.getHours() === 8 && now.getMinutes() <= 30)
    );
  },
  COFFEE_ADDICT: (user: User) => user.currentStreak >= 30,
  SUSTAINABILITY_CHAMPION: (user: User) => user.ecoPoints >= 500,
  APPRECIATION_STAR: (user: User) => user.engagementPoints >= 300,
  STREAK_MASTER: (user: User) => user.longestStreak >= 60,
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CouponTypeEntity)
    private readonly couponTypeRepository: Repository<CouponTypeEntity>,
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
  ) { }

  async getStats(employeeId: string) {
    const user = await this.userRepository.findOne({
      where: { id: employeeId },
    });

    const badges = await this.userBadgeRepository.find({
      where: { userId: employeeId },
      relations: ['badge'],
    });

    // Calculate leaderboard rank
    const rank = await this.userRepository
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'EMPLOYEE' })
      .andWhere('u.engagementPoints > :points', {
        points: user?.engagementPoints || 0,
      })
      .getCount();

    return {
      engagementPoints: user?.engagementPoints || 0,
      ecoPoints: user?.ecoPoints || 0,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      lastRedemptionDate: user?.lastRedemptionDate || null,
      badges: badges.map((ub) => ({
        name: ub.badge.name,
        description: ub.badge.description,
        earnedAt: ub.earnedAt,
      })),
      leaderboardRank: rank + 1,
      carbonSaved: (user?.ecoPoints || 0) * 0.01, // Approximate kg CO₂e saved
    };
  }

  async addEcoPoints(dto: {
    employeeId: string;
    beverageType: string;
    reusableCup: boolean;
  }) {
    const user = await this.userRepository.findOne({
      where: { id: dto.employeeId },
    });
    if (!user) {
      return { ecoPointsAdded: 0, totalEcoPoints: 0 };
    }

    // Calculate eco-points based on beverage type
    let ecoPointsAdded = 0;
    const bevType = dto.beverageType.toUpperCase();

    // Map to modifier keys
    if (bevType.includes('BLACK') || bevType === 'COFFEE') {
      ecoPointsAdded += ECO_POINTS_MODIFIERS.BLACK_COFFEE;
    } else if (bevType.includes('OAT') || bevType.includes('SOY')) {
      ecoPointsAdded += ECO_POINTS_MODIFIERS.OAT_SOY;
    } else if (bevType.includes('DAIRY')) {
      ecoPointsAdded += ECO_POINTS_MODIFIERS.DAIRY_MILK;
    } else if (bevType.includes('GREEN') || bevType === 'TEA') {
      ecoPointsAdded += ECO_POINTS_MODIFIERS.GREEN_TEA;
    }

    // Bonus for reusable cup
    if (dto.reusableCup) {
      ecoPointsAdded += ECO_POINTS_MODIFIERS.REUSABLE_CUP;
    }

    // Ensure eco-points don't go below 0 for this transaction
    ecoPointsAdded = Math.max(0, ecoPointsAdded);

    user.ecoPoints += ecoPointsAdded;
    await this.userRepository.save(user);

    // Check for new badges
    await this.checkAndAwardBadges(user);

    this.logger.log(
      `Eco-points awarded: ${ecoPointsAdded} to ${dto.employeeId} (beverage: ${dto.beverageType}, reusable: ${dto.reusableCup})`,
    );

    return {
      ecoPointsAdded,
      totalEcoPoints: user.ecoPoints,
      carbonFootprint: CARBON_FOOTPRINT[bevType] || 0,
    };
  }

  async getLeaderboard(limit = 20) {
    const leaders = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.name',
        'u.department',
        'u.engagementPoints',
        'u.ecoPoints',
        'u.currentStreak',
        'u.photo',
      ])
      .where('u.role = :role', { role: 'EMPLOYEE' })
      .orderBy('u.engagementPoints', 'DESC')
      .take(limit)
      .getMany();

    return leaders.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      department: user.department,
      engagementPoints: user.engagementPoints,
      ecoPoints: user.ecoPoints,
      currentStreak: user.currentStreak,
      photo: user.photo,
    }));
  }

  async getDepartmentLeaderboard() {
    const departments = await this.userRepository
      .createQueryBuilder('u')
      .select('u.department', 'department')
      .addSelect('SUM(u.engagementPoints)', 'totalEngagement')
      .addSelect('SUM(u.ecoPoints)', 'totalEco')
      .addSelect('COUNT(u.id)', 'memberCount')
      .addSelect('AVG(u.engagementPoints)', 'avgEngagement')
      .where('u.role = :role', { role: 'EMPLOYEE' })
      .andWhere('u.department IS NOT NULL')
      .groupBy('u.department')
      .orderBy('"totalEngagement"', 'DESC')
      .getRawMany();

    return departments.map((dept, index) => ({
      rank: index + 1,
      department: dept.department,
      totalEngagement: parseInt(dept.totalEngagement, 10),
      totalEco: parseInt(dept.totalEco, 10),
      memberCount: parseInt(dept.memberCount, 10),
      avgEngagement: Math.round(parseFloat(dept.avgEngagement)),
    }));
  }

  async getBadges(employeeId: string) {
    const userBadges = await this.userBadgeRepository.find({
      where: { userId: employeeId },
      relations: ['badge'],
    });
    return userBadges.map((ub) => ({
      name: ub.badge.name,
      description: ub.badge.description,
      earnedAt: ub.earnedAt,
    }));
  }

  async getStreakStatus(employeeId: string) {
    const user = await this.userRepository.findOne({
      where: { id: employeeId },
    });
    if (!user) {
      return { currentStreak: 0, streakWarning: false };
    }

    // Check if streak is at risk (no redemption today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.lastRedemptionDate
      ? new Date(user.lastRedemptionDate)
      : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    const streakAtRisk =
      user.currentStreak > 0 &&
      (!lastDate || lastDate.getTime() < today.getTime());

    // Check for streak milestones
    const nextMilestone =
      user.currentStreak < 7
        ? 7
        : user.currentStreak < 30
          ? 30
          : user.currentStreak < 60
            ? 60
            : 100;

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakAtRisk,
      nextMilestone,
      daysToMilestone: nextMilestone - user.currentStreak,
      reward:
        nextMilestone === 7
          ? 'Free Coffee Coupon'
          : nextMilestone === 30
            ? 'Coffee Addict Badge'
            : 'Streak Master Badge',
    };
  }

  async getCarbonLedger(employeeId: string, page = 1, limit = 10) {
    const [entries, total] = await this.ledgerEntryRepository.findAndCount({
      where: { employeeId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = entries.map((entry) => {
      const bevType = (entry.couponType || '').toUpperCase();
      let points = 0;
      let co2Saved = 0;

      // Only redemptions save carbon in our model
      if (entry.type === 'REDEMPTION') {
        co2Saved = CARBON_FOOTPRINT[bevType] || 0;

        if (bevType.includes('BLACK') || bevType === 'COFFEE') {
          points = ECO_POINTS_MODIFIERS.BLACK_COFFEE;
        } else if (bevType.includes('OAT') || bevType.includes('SOY')) {
          points = ECO_POINTS_MODIFIERS.OAT_SOY;
        } else if (bevType.includes('DAIRY')) {
          points = ECO_POINTS_MODIFIERS.DAIRY_MILK;
        } else if (bevType.includes('GREEN') || bevType === 'TEA') {
          points = ECO_POINTS_MODIFIERS.GREEN_TEA;
        }
      }

      let title = '';
      switch (entry.type) {
        case 'ISSUANCE':
          title = `Allotted ${entry.couponType || 'Voucher(s)'}`;
          break;
        case 'REDEMPTION':
          title = `Redeemed ${entry.couponType || 'Voucher'}`;
          break;
        case 'TRANSFER_DEBIT':
          title = `Gifted ${entry.couponType || 'Voucher'}`;
          break;
        case 'TRANSFER_CREDIT':
          title = `Received ${entry.couponType || 'Voucher'}`;
          break;
        default:
          title = `${entry.type} ${entry.couponType || ''}`;
      }

      return {
        id: entry.id,
        type: bevType || 'VOUCHER',
        title: title,
        points: Math.max(0, points),
        co2Saved: co2Saved,
        timestamp: entry.createdAt.toISOString(),
      };
    });

    return {
      entries: result,
      total,
      page,
      limit,
    };
  }

  async checkAndAwardBadges(user: User) {
    const allBadges = await this.badgeRepository.find();
    const existingBadges = await this.userBadgeRepository.find({
      where: { userId: user.id },
    });

    const existingBadgeNames = new Set(existingBadges.map((ub) => ub.badgeId));

    for (const badge of allBadges) {
      if (existingBadgeNames.has(badge.id)) continue;

      const criteriaFn = BADGE_CRITERIA[badge.name];
      if (criteriaFn && criteriaFn(user)) {
        const userBadge = this.userBadgeRepository.create({
          userId: user.id,
          badgeId: badge.id,
        });
        await this.userBadgeRepository.save(userBadge);
        this.logger.log(`Badge awarded: ${badge.name} to user ${user.id}`);
      }
    }
  }
}
