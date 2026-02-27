import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SellerService, SellerSummary } from '../seller.service';
import { timer, switchMap, catchError, of } from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';

@Component({
    selector: 'app-seller-summary',
    standalone: true,
    imports: [CommonModule, DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="summary-container">
      <header class="summary-header">
        <div class="header-main">
          <h2>Daily Overview</h2>
          <p class="subtitle">Your sales performance for {{ selectedDate() === todayStr ? 'today' : (selectedDate() | date:'mediumDate') }}</p>
        </div>
        <div class="header-actions">
          <div class="date-picker-wrapper">
             <label for="summaryDate">Select Date:</label>
             <input 
               type="date" 
               id="summaryDate" 
               [value]="selectedDate()" 
               (input)="onDateChange($event)"
               [max]="todayStr"
               class="apple-date-input"
             >
          </div>
        </div>
      </header>

      @if (summary()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">🎟️</span>
            <div class="stat-info">
              <span class="stat-label">Total Coupons</span>
              <span class="stat-value">{{ summary()!.totalCount }}</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">💰</span>
            <div class="stat-info">
              <span class="stat-label">Total Value</span>
              <span class="stat-value">₹{{ summary()!.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">🍃</span>
            <div class="stat-info">
              <span class="stat-label">CO2 Saved</span>
              <span class="stat-value">{{ summary()!.totalCo2Saved | number:'1.1-1' }} kg</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">🤝</span>
            <div class="stat-info">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ summary()!.transactionCount }}</span>
            </div>
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Calculating today's totals...</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .summary-container {
      padding: 1rem;
      max-width: 900px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 2.5rem;
    }

    h2 {
      font-size: 28px;
      font-weight: 700;
      color: var(--apple-text-primary);
      margin: 0;
    }

    .subtitle {
      color: var(--apple-text-secondary);
      font-size: 16px;
      margin-top: 6px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: var(--apple-radius-lg);
      box-shadow: var(--apple-shadow-lg);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid rgba(0,0,0,0.03);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 32px;
      background: rgba(0,0,0,0.03);
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--apple-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--apple-text-primary);
      margin-top: 4px;
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
      color: var(--apple-text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0,122,255,0.1);
      border-top-color: var(--apple-blue);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .summary-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .date-picker-wrapper {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
    }

    .date-picker-wrapper label {
      font-size: 12px;
      font-weight: 600;
      color: var(--apple-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .apple-date-input {
      padding: 8px 12px;
      border-radius: var(--apple-radius-sm);
      border: 1px solid rgba(0,0,0,0.1);
      font-family: inherit;
      font-size: 14px;
      color: var(--apple-text-primary);
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      box-shadow: var(--apple-shadow-sm);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .apple-date-input:focus {
      outline: none;
      border-color: var(--apple-blue);
      box-shadow: 0 0 0 3px rgba(0,122,255,0.1);
    }
  `]
})
export class SummaryComponent {
    private readonly sellerService = inject(SellerService);
    todayStr = new Date().toISOString().split('T')[0];
    selectedDate = signal(this.todayStr);

    summary = toSignal(
        toObservable(this.selectedDate).pipe(
            switchMap(date => this.sellerService.getSummary(date)),
            catchError((err) => {
                console.error('Failed to load summary', err);
                return of(null);
            })
        ),
        { initialValue: null as SellerSummary | null }
    );

    onDateChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.value) {
            this.selectedDate.set(input.value);
        }
    }
}
