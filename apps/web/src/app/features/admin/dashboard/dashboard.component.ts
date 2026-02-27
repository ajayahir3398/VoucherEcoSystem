import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, OperationalDashboardData, AnalyticalDashboardData, StrategicDashboardData } from '../../../core/services/admin.service';
import { forkJoin } from 'rxjs';

interface Metric {
  label: string;
  value: string;
  icon: string;
  bgColor: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  metrics = signal<Metric[]>([]);
  operationalData = signal<OperationalDashboardData | null>(null);
  analyticalData = signal<AnalyticalDashboardData | null>(null);
  strategicData = signal<StrategicDashboardData | null>(null);
  isLoading = signal<boolean>(true);

  maxBeverageCount = signal<number>(1);

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    forkJoin({
      stats: this.adminService.getDashboardStats(),
      op: this.adminService.getOperationalDashboard(),
      an: this.adminService.getAnalyticalDashboard(),
      st: this.adminService.getStrategicDashboard()
    }).subscribe({
      next: (res) => {
        this.metrics.set([
          { label: 'Total Users', value: res.stats.totalUsers.toString(), icon: '👥', bgColor: 'rgba(0, 122, 255, 0.1)' },
          { label: 'Active Sellers', value: res.stats.activeSellers.toString(), icon: '🏪', bgColor: 'rgba(52, 199, 89, 0.1)' },
          { label: 'Today\'s Redemptions', value: res.stats.todaysRedemptions.toString(), icon: '🎟️', bgColor: 'rgba(255, 149, 0, 0.1)' },
          { label: 'Pending Syncs', value: res.stats.pendingSyncs.toString(), icon: '🔄', bgColor: 'rgba(255, 59, 48, 0.1)' }
        ]);

        this.operationalData.set(res.op);

        const anData = res.an;
        this.analyticalData.set(anData);
        // Calculate max beverage count for relative CSS chart heights
        const bevMax = Math.max(...anData.beverageTrends.map(d => parseInt(d.total, 10)), 1);
        this.maxBeverageCount.set(bevMax);

        this.strategicData.set(res.st);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
