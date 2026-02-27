import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService, BurnRateTrend } from '../../../core/services/finance.service';

@Component({
    selector: 'app-burn-rate',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './burn-rate.component.html',
    styleUrls: ['./burn-rate.component.scss']
})
export class BurnRateComponent implements OnInit {
    issuanceTrends = signal<BurnRateTrend[]>([]);
    redemptionTrends = signal<BurnRateTrend[]>([]);
    isLoading = signal(true);

    // Derive maximum value for charting
    maxAmount = computed(() => {
        const iMax = Math.max(...this.issuanceTrends().map(t => t.amount), 0);
        const rMax = Math.max(...this.redemptionTrends().map(t => t.amount), 0);
        return Math.max(iMax, rMax, 100); // avoid div by zero
    });

    totalIssuance = computed(() => this.issuanceTrends().reduce((sum, t) => sum + t.amount, 0));
    totalRedemption = computed(() => this.redemptionTrends().reduce((sum, t) => sum + t.amount, 0));

    burnRatePercentage = computed(() => {
        if (this.totalIssuance() === 0) return 0;
        return (this.totalRedemption() / this.totalIssuance()) * 100;
    });

    constructor(private financeService: FinanceService) { }

    ngOnInit() {
        this.financeService.getBurnRateAnalytics().subscribe({
            next: (res) => {
                this.issuanceTrends.set(res.issuanceTrends);
                this.redemptionTrends.set(res.redemptionTrends);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load burn rate data', err);
                this.isLoading.set(false);
            }
        });
    }

    getHeight(amount: number): string {
        return `${(amount / this.maxAmount()) * 100}%`;
    }
}
