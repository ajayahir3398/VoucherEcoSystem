import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import {
  Redemption,
  LedgerEntry,
  SyncConflict,
  User,
  SellerNonce,
  Transfer,
} from '../../entities';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(SyncConflict)
    private readonly syncConflictRepository: Repository<SyncConflict>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SellerNonce)
    private readonly sellerNonceRepository: Repository<SellerNonce>,
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
  ) { }

  async getEodReport(date: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all redemptions for the day
    const redemptions = await this.redemptionRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    // Get all ledger entries for the day
    const ledgerEntries = await this.ledgerEntryRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        type: 'REDEMPTION' as any,
      },
    });

    // Compare and find mismatches
    const redemptionNonces = new Set(redemptions.map((r) => r.nonce));
    const ledgerNonces = new Set(
      ledgerEntries.filter((l) => l.refNonce).map((l) => l.refNonce),
    );

    const unmatchedRedemptions = redemptions.filter(
      (r) => !ledgerNonces.has(r.nonce),
    );
    const unmatchedLedger = ledgerEntries.filter(
      (l) => l.refNonce && !redemptionNonces.has(l.refNonce),
    );

    const exceptionItems = [
      ...unmatchedRedemptions.map((r) => ({
        type: 'UNMATCHED_REDEMPTION',
        id: r.id,
        nonce: r.nonce,
        employeeId: r.employeeId,
        sellerId: r.sellerId,
        quantity: r.quantity,
        timestamp: r.createdAt,
      })),
      ...unmatchedLedger.map((l) => ({
        type: 'UNMATCHED_LEDGER',
        id: l.id,
        nonce: l.refNonce,
        employeeId: l.employeeId,
        amount: l.amount,
        timestamp: l.createdAt,
      })),
    ];

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalRedemptions: redemptions.length,
      totalLedgerEntries: ledgerEntries.length,
      matchedTransactions: redemptions.length - unmatchedRedemptions.length,
      exceptionItemCount: exceptionItems.length,
      exceptionItems,
      reconciledAt: new Date().toISOString(),
    };
  }

  async getAnomalies() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Transaction spike detection (> 3σ from mean per user per day)
    const dailyUserCounts = await this.redemptionRepository
      .createQueryBuilder('r')
      .select('r.employeeId', 'employeeId')
      .addSelect('DATE(r.createdAt)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('r.createdAt > :since', { since: thirtyDaysAgo })
      .groupBy('r.employeeId')
      .addGroupBy('DATE(r.createdAt)')
      .getRawMany();

    // Group by user and calculate stats
    const userStats: Record<
      string,
      { counts: number[]; mean: number; stddev: number }
    > = {};
    for (const row of dailyUserCounts) {
      const uid = row.employeeId;
      if (!userStats[uid]) userStats[uid] = { counts: [], mean: 0, stddev: 0 };
      userStats[uid].counts.push(parseInt(row.count, 10));
    }

    const anomalies: any[] = [];
    for (const [uid, stats] of Object.entries(userStats)) {
      const n = stats.counts.length;
      if (n < 3) continue;
      stats.mean = stats.counts.reduce((a, b) => a + b, 0) / n;
      stats.stddev = Math.sqrt(
        stats.counts.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) / n,
      );
      const threshold = stats.mean + 3 * stats.stddev;
      for (const count of stats.counts) {
        if (count > threshold) {
          anomalies.push({
            type: 'TRANSACTION_SPIKE',
            employeeId: uid,
            count,
            mean: Math.round(stats.mean * 100) / 100,
            stddev: Math.round(stats.stddev * 100) / 100,
            threshold: Math.round(threshold * 100) / 100,
          });
        }
      }
    }

    // 2. Failed nonce attempts (consumed nonces that got re-used)
    const recentConsumedNonces = await this.sellerNonceRepository.count({
      where: {
        consumed: true,
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
    });

    // 3. Sync conflicts
    const syncConflicts = await this.syncConflictRepository.find({
      where: { resolved: false },
      order: { createdAt: 'DESC' },
    });

    return {
      anomalies,
      failedNonceAttempts: recentConsumedNonces,
      syncConflicts,
      generatedAt: new Date().toISOString(),
    };
  }

  async getOperationalDashboard() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    // Recent transactions
    const liveTransactions = await this.redemptionRepository.find({
      where: { createdAt: MoreThan(last24h) },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Active sellers (had a redemption in last hour)
    const activeSellers = await this.redemptionRepository
      .createQueryBuilder('r')
      .select('r.sellerId')
      .distinct(true)
      .where('r.createdAt > :since', { since: lastHour })
      .getCount();

    // Pending sync conflicts
    const pendingSyncQueueDepth = await this.syncConflictRepository.count({
      where: { resolved: false },
    });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRedemptions = await this.redemptionRepository.count({
      where: { createdAt: MoreThan(today) },
    });

    return {
      liveTransactions: liveTransactions.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        sellerId: r.sellerId,
        quantity: r.quantity,
        status: r.status,
        createdAt: r.createdAt,
      })),
      activeSellers,
      pendingSyncQueueDepth,
      todayRedemptions,
    };
  }

  async getAnalyticalDashboard() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Beverage trends (redemptions by coupon type per day)
    const beverageTrends = await this.redemptionRepository
      .createQueryBuilder('r')
      .select('r.couponTypeId', 'couponTypeId')
      .addSelect('DATE(r.createdAt)', 'day')
      .addSelect('SUM(r.quantity)', 'total')
      .where('r.createdAt > :since', { since: thirtyDaysAgo })
      .andWhere('r.status = :status', { status: 'COMPLETED' })
      .andWhere('r.couponTypeId IS NOT NULL')
      .groupBy('r.couponTypeId')
      .addGroupBy('DATE(r.createdAt)')
      .orderBy('day', 'ASC')
      .getRawMany();

    // Peak-hour heat map (hour of day → redemption count)
    const peakHourHeatMap = await this.redemptionRepository
      .createQueryBuilder('r')
      .select('EXTRACT(HOUR FROM r.createdAt)', 'hour')
      .addSelect('EXTRACT(DOW FROM r.createdAt)', 'dayOfWeek')
      .addSelect('COUNT(*)', 'count')
      .where('r.createdAt > :since', { since: thirtyDaysAgo })
      .groupBy('EXTRACT(HOUR FROM r.createdAt)')
      .addGroupBy('EXTRACT(DOW FROM r.createdAt)')
      .getRawMany();

    // P2P transfer frequency
    const p2pTransferFrequency = await this.transferRepository.count({
      where: { createdAt: MoreThan(thirtyDaysAgo) },
    });

    // Carbon footprint by department
    const carbonByDepartment = await this.userRepository
      .createQueryBuilder('u')
      .select('u.department', 'department')
      .addSelect('SUM(u.ecoPoints)', 'totalEcoPoints')
      .addSelect('COUNT(u.id)', 'employeeCount')
      .where('u.role = :role', { role: 'EMPLOYEE' })
      .andWhere('u.department IS NOT NULL')
      .groupBy('u.department')
      .getRawMany();

    return {
      beverageTrends,
      peakHourHeatMap: peakHourHeatMap.map((h) => ({
        hour: parseInt(h.hour, 10),
        dayOfWeek: parseInt(h.dayOfWeek, 10),
        count: parseInt(h.count, 10),
      })),
      p2pTransferFrequency,
      carbonFootprintByDepartment: carbonByDepartment.map((d) => ({
        department: d.department,
        totalEcoPoints: parseInt(d.totalEcoPoints, 10) || 0,
        employeeCount: parseInt(d.employeeCount, 10),
      })),
    };
  }

  async getStrategicDashboard() {
    // Total issuance
    const totalIssuance = await this.ledgerEntryRepository
      .createQueryBuilder('le')
      .select('SUM(le.amount)', 'total')
      .where('le.type = :type', { type: 'ISSUANCE' })
      .getRawOne();

    // Total redemption
    const totalRedemption = await this.ledgerEntryRepository
      .createQueryBuilder('le')
      .select('SUM(ABS(le.amount))', 'total')
      .where('le.type = :type', { type: 'REDEMPTION' })
      .getRawOne();

    const issuance = parseInt(totalIssuance?.total, 10) || 0;
    const redemption = parseInt(totalRedemption?.total, 10) || 0;

    // Burn rate (% of issued coupons that have been redeemed)
    const burnRate = issuance > 0 ? (redemption / issuance) * 100 : 0;

    // Total employees
    const totalEmployees = await this.userRepository.count({
      where: { role: 'EMPLOYEE' as any, isActive: true },
    });

    // Active employees (at least 1 redemption in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeEmployees = await this.redemptionRepository
      .createQueryBuilder('r')
      .select('r.employeeId')
      .distinct(true)
      .where('r.createdAt > :since', { since: thirtyDaysAgo })
      .getCount();

    // Adoption rate
    const adoptionRate =
      totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;

    return {
      totalIssuance: issuance,
      totalRedemption: redemption,
      burnRate: Math.round(burnRate * 100) / 100,
      programROI: Math.round(adoptionRate * 100) / 100,
      totalEmployees,
      activeEmployees,
      adoptionRate: Math.round(adoptionRate * 100) / 100,
    };
  }

  async exportTaxCompliance(date?: string): Promise<string> {
    const reportData = await this.getEodReport(date);

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const redemptions = await this.redemptionRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const ledgerEntries = await this.ledgerEntryRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        type: 'REDEMPTION' as any,
      },
    });

    const ledgerNonces = new Set(
      ledgerEntries.filter((l) => l.refNonce).map((l) => l.refNonce),
    );

    const matchedRedemptions = redemptions.filter((r) => ledgerNonces.has(r.nonce));

    // CSV Header
    let csvStr = 'Variance Type,Reference ID / Nonce,Employee ID,Amount,Quantity,Timestamp\n';

    // Matched Transactions
    matchedRedemptions.forEach(item => {
      const type = `"MATCHED"`;
      const ref = `"${item.nonce || item.id}"`;
      const emp = `"${item.employeeId || 'N/A'}"`;

      // Pull amount from corresponding ledger entry
      const ledgerEntry = ledgerEntries.find(l => l.refNonce === item.nonce);
      const amtStr = ledgerEntry && ledgerEntry.amount !== undefined ? ledgerEntry.amount.toString() : '';
      const amt = `"${amtStr}"`;

      const qty = `"${item.quantity}"`;
      const tsVal = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
      const ts = `"${tsVal.toISOString()}"`;

      csvStr += `${type},${ref},${emp},${amt},${qty},${ts}\n`;
    });

    // Exception Items
    reportData.exceptionItems.forEach(item => {
      const type = `"${item.type.replace('_', ' ')}"`;
      const ref = `"${item.nonce || item.id}"`;
      const emp = `"${item.employeeId || 'N/A'}"`;

      let amtStr = '';
      let qtyStr = '';
      if ('quantity' in item && item.quantity !== undefined) {
        qtyStr = `${item.quantity}`;
      } else if ('amount' in item && item.amount !== undefined) {
        amtStr = `${item.amount}`;
      }
      const amt = `"${amtStr}"`;
      const qty = `"${qtyStr}"`;

      const tsVal = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
      const ts = `"${tsVal.toISOString()}"`;

      csvStr += `${type},${ref},${emp},${amt},${qty},${ts}\n`;
    });

    // Summary block at bottom
    csvStr += `\nSUMMARY,,,,\n`;
    csvStr += `Report Date,${reportData.date},,,\n`;
    csvStr += `Total Redemptions,${reportData.totalRedemptions},,,\n`;
    csvStr += `Ledger Entries,${reportData.totalLedgerEntries},,,\n`;
    csvStr += `Matched Transactions,${reportData.matchedTransactions},,,\n`;
    csvStr += `Exception Count,${reportData.exceptionItemCount},,,\n`;
    csvStr += `Generated At,${reportData.reconciledAt},,,\n`;

    return csvStr;
  }

  async getBurnRateAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Group issuances by day (monetary amount)
    const issuanceTrends = await this.ledgerEntryRepository
      .createQueryBuilder('le')
      .select('DATE(le.createdAt)', 'day')
      .addSelect('SUM(le.amount)', 'total')
      .where('le.type = :type', { type: 'ISSUANCE' })
      .andWhere('le.createdAt > :since', { since: thirtyDaysAgo })
      .groupBy('DATE(le.createdAt)')
      .orderBy('day', 'ASC')
      .getRawMany();

    // Group redemptions by day (absolute monetary amount)
    const redemptionTrends = await this.ledgerEntryRepository
      .createQueryBuilder('le')
      .select('DATE(le.createdAt)', 'day')
      .addSelect('SUM(ABS(le.amount))', 'total')
      .where('le.type = :type', { type: 'REDEMPTION' })
      .andWhere('le.createdAt > :since', { since: thirtyDaysAgo })
      .groupBy('DATE(le.createdAt)')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      issuanceTrends: issuanceTrends.map(i => ({
        date: i.day instanceof Date ? i.day.toISOString().split('T')[0] : i.day,
        amount: parseFloat(i.total) || 0
      })),
      redemptionTrends: redemptionTrends.map(r => ({
        date: r.day instanceof Date ? r.day.toISOString().split('T')[0] : r.day,
        amount: parseFloat(r.total) || 0
      }))
    };
  }
}
