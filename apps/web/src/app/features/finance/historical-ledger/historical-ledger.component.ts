import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, LedgerEntryPayload } from '../../../core/services/finance.service';

@Component({
    selector: 'app-historical-ledger',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [DatePipe],
    templateUrl: './historical-ledger.component.html',
    styleUrls: ['./historical-ledger.component.scss']
})
export class HistoricalLedgerComponent implements OnInit {
    ledgerEntries = signal<LedgerEntryPayload[]>([]);
    totalEntries = signal(0);
    currentPage = signal(1);
    pageSize = signal(20);
    isLoading = signal(false);

    filterType = signal<string>('');
    filterStartDate = signal<string>('');
    filterEndDate = signal<string>('');

    constructor(private financeService: FinanceService) { }

    ngOnInit() {
        this.loadLedger();
    }

    loadLedger(page = 1) {
        this.isLoading.set(true);
        this.currentPage.set(page);

        this.financeService.getAllLedgerEntries(
            page,
            this.pageSize(),
            this.filterType() || undefined,
            this.filterStartDate() || undefined,
            this.filterEndDate() || undefined
        ).subscribe({
            next: (res) => {
                this.ledgerEntries.set(res.items);
                this.totalEntries.set(res.total);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load ledger', err);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        this.loadLedger(1);
    }

    clearFilters() {
        this.filterType.set('');
        this.filterStartDate.set('');
        this.filterEndDate.set('');
        this.loadLedger(1);
    }

    nextPage() {
        if (this.currentPage() * this.pageSize() < this.totalEntries()) {
            this.loadLedger(this.currentPage() + 1);
        }
    }

    prevPage() {
        if (this.currentPage() > 1) {
            this.loadLedger(this.currentPage() - 1);
        }
    }

    getTypeBadgeClass(type: string): string {
        switch (type) {
            case 'ISSUANCE': return 'badge-issuance';
            case 'REDEMPTION': return 'badge-redemption';
            case 'TRANSFER_DEBIT': return 'badge-debit';
            case 'TRANSFER_CREDIT': return 'badge-credit';
            default: return 'badge-default';
        }
    }
}
