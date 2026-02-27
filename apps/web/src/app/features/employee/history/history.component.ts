import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgClass, DatePipe, RouterModule],
  template: `
    <div class="ios-container">
      <div class="scroll-content">
        <h1 class="large-title">Coupon Allotment History</h1>
        
        @if (isLoading()) {
          <div class="loading-state">
            <div class="ios-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        } @else if (history().length > 0) {
          <div class="ios-list">
            @for (item of history(); track item.id) {
              <div class="ios-list-item">
                <div class="item-icon-bg" [ngClass]="getCategoryClass(item)">
                  {{ getIcon(item) }}
                </div>
                
                <div class="item-body">
                  <span class="item-title">{{ getDescription(item) }}</span>
                  <div class="item-subtitle-group">
                    <span class="item-subtitle">{{ item.createdAt | date: 'MMM d, y, h:mm a' }}</span>
                    @if (item.sellerId) {
                      <span class="item-metadata">• Seller: {{ item.sellerId.substring(0,8) }}</span>
                    }
                  </div>
                </div>
                
                <div class="item-trailing">
                  <span class="item-amount" [ngClass]="(item.type || '').toLowerCase()">
                    {{ getAmountPrefix(item) }}{{ item.quantity }} units
                  </span>
                  <span class="item-sub-amount">{{ item.amount }} pts</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon-bg">
              <span class="icon">📋</span>
            </div>
            <h3>No Transactions</h3>
            <p>Your recent activity will appear here once you start using or gifting coupons.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: #F2F2F7;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .ios-container {
        max-width: 480px;
        margin: 0 auto;
        min-height: 100vh;
      }

      /* Navigation Bar */
      .ios-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        padding-top: 3rem;
        background: rgba(242,242,247,0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        position: sticky;
        top: 0;
        z-index: 50;
        border-bottom: 0.5px solid rgba(0,0,0,0.1);
      }
      .menu-toggle-btn {
        margin-right: 0.5rem;
        min-width: 40px;
        color: #1C1C1E;
      }
      @media (min-width: 769px) { .menu-toggle-btn { display: none; } }
      .nav-btn {
        background: none;
        border: none;
        color: #007AFF;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0;
        cursor: pointer;
        min-width: 60px;
      }
      .nav-title {
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
        color: #000;
      }

      .scroll-content {
        padding: 0.5rem;
      }

      .large-title {
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
        color: #000;
        letter-spacing: 0.35px;
      }

      /* Loading State */
      .loading-state {
        text-align: center;
        padding: 4rem 1rem;
        color: #8E8E93;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .ios-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(0,0,0,0.1);
        border-top: 3px solid #8E8E93;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      /* List Group */
      .ios-list {
        background: #FFFFFF;
        border-radius: 12px;
        overflow: hidden;
      }
      .ios-list-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        gap: 1rem;
        border-bottom: 0.5px solid #E5E5EA;
        background: white;
      }
      .ios-list-item:last-child {
        border-bottom: none;
      }

      .item-icon-bg {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .item-icon-bg.issuance { background: rgba(52, 199, 89, 0.15); color: #34C759; }
      .item-icon-bg.redemption { background: rgba(255, 59, 48, 0.15); color: #FF3B30; }
      .item-icon-bg.transfer_credit { background: rgba(0, 122, 255, 0.15); color: #007AFF; }
      .item-icon-bg.transfer_debit { background: rgba(142, 142, 147, 0.15); color: #8E8E93; }

      .item-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .item-title {
        font-size: 1rem;
        font-weight: 600;
        color: #000;
        margin-bottom: 0.15rem;
      }
      .item-subtitle {
        font-size: 0.8rem;
        color: #8E8E93;
      }

      .item-trailing {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.15rem;
      }
      .item-amount {
        font-size: 1.05rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .item-amount.issuance, .item-amount.transfer_credit { color: #34C759; }
      .item-amount.redemption, .item-amount.transfer_debit { color: #000; }
      
      .item-sub-amount {
        font-size: 0.75rem;
        color: #8E8E93;
        font-weight: 500;
      }

      .item-subtitle-group {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .item-metadata {
        font-size: 0.8rem;
        color: #8E8E93;
        opacity: 0.8;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #8E8E93;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .empty-icon-bg {
        width: 64px;
        height: 64px;
        background: rgba(142, 142, 147, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
      }
      .empty-icon-bg .icon { font-size: 2rem; }
      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #000;
      }
      .empty-state p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.4;
      }
    `
  ]
})
export class HistoryComponent implements OnInit, OnDestroy {
  history = signal<any[]>([]);
  isLoading = signal(true);
  private sub = new Subscription();

  constructor(
    private readonly walletService: WalletService,
    private readonly authService: AuthService,
  ) { }

  ngOnInit() {
    this.sub.add(
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.loadHistory();
        } else {
          this.isLoading.set(false);
          this.history.set([]);
        }
      }),
    );
  }

  loadHistory() {
    this.isLoading.set(true);

    this.walletService.getHistory({ limit: 50 }).subscribe({
      next: (data: any) => {
        this.history.set(data.items || []);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load history', err);
        this.isLoading.set(false);
      },
    });
  }

  getIcon(item: any): string {
    const type = item.type;
    const cType = (item.couponType || '').toLowerCase();

    if (cType.includes('coffee')) return '☕';
    if (cType.includes('tea')) return '🍵';
    if (cType.includes('cookie') || cType.includes('snack')) return '🍪';

    if (type === 'ISSUANCE') return '📥';
    if (type === 'REDEMPTION') return '☕';
    if (type === 'TRANSFER_CREDIT') return '🎁';
    if (type === 'TRANSFER_DEBIT') return '📤';
    return '🎟️';
  }

  getCategoryClass(item: any): string {
    return (item.type || '').toLowerCase();
  }

  getDescription(item: any): string {
    const cName = item.couponType || 'Coupon';
    switch (item.type) {
      case 'ISSUANCE':
        return `${cName} Allotment`;
      case 'REDEMPTION':
        return `${cName} Redeemed`;
      case 'TRANSFER_CREDIT':
        return `Received ${cName}`;
      case 'TRANSFER_DEBIT':
        return `Sent ${cName}`;
      default:
        return `${cName} ${(item.type || '').replace('_', ' ')}`;
    }
  }

  getAmountPrefix(item: any): string {
    if (item.type === 'ISSUANCE' || item.type === 'TRANSFER_CREDIT') return '+';
    return '-';
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
