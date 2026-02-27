import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SellerService, SellerTransaction } from '../seller.service';
import { timer, switchMap, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-transaction-feed',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="feed-container">
      <header>
        <h2>Redemption Feed</h2>
        <p class="subtitle">Live updates of scanned coupons</p>
      </header>

      @if (transactions().length > 0) {
        <div class="transaction-list">
          @for (tx of transactions(); track tx.id) {
            <div class="tx-card">
              <div class="tx-main">
                <span class="tx-icon">🥤</span>
                <div class="tx-details">
                  <span class="tx-coupon">{{ tx.couponName }}</span>
                  <span class="tx-employee">{{ tx.employeeName }}</span>
                </div>
              </div>
              <div class="tx-meta">
                <span class="tx-time">{{
                  tx.createdAt | date: 'shortTime'
                }}</span>
                <span class="tx-points">+{{ tx.ecoPointsEarned }}🌱</span>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-icon">📊</span>
          <p>No transactions yet</p>
          <p class="hint">Scanned coupons will appear here instantly</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .feed-container {
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
      }
      header {
        margin-bottom: 1rem;
      }
      h2 {
        font-size: 24px;
        font-weight: 700;
        color: var(--apple-text-primary);
        margin: 0;
      }
      .subtitle {
        color: var(--apple-text-secondary);
        font-size: 15px;
        margin-top: 4px;
      }

      .transaction-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .tx-card {
        background: white;
        padding: 16px 20px;
        border-radius: var(--apple-radius-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.05);
        animation: slideIn 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        transition: transform 0.2s ease;
      }
      .tx-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--apple-shadow-lg);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .tx-main {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .tx-icon {
        font-size: 20px;
        background: rgba(0, 122, 255, 0.1);
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }
      .tx-details {
        display: flex;
        flex-direction: column;
      }
      .tx-coupon {
        font-weight: 600;
        color: var(--apple-text-primary);
        font-size: 16px;
      }
      .tx-employee {
        font-size: 14px;
        color: var(--apple-text-secondary);
        margin-top: 2px;
      }

      .tx-meta {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .tx-time {
        font-size: 13px;
        color: var(--apple-text-secondary);
      }
      .tx-points {
        font-weight: 700;
        font-size: 14px;
        color: #34c759; /* Apple Green */
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        background: rgba(0,0,0,0.02);
        border-radius: var(--apple-radius-lg);
        border: 2px dashed rgba(0,0,0,0.05);
      }
      .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      .hint {
        font-size: 14px;
        color: var(--apple-text-secondary);
        margin-top: 8px;
      }
    `,
  ],
})
export class TransactionFeedComponent {
  private readonly sellerService = inject(SellerService);

  transactions = toSignal(
    timer(0, 10000).pipe(
      switchMap(() => this.sellerService.getFeed()),
      catchError((err) => {
        console.error('Failed to load feed', err);
        return of([]);
      })
    ),
    { initialValue: [] as SellerTransaction[] }
  );

}
