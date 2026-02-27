import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService, CouponBalance } from './wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { GamificationService, GamificationStats, StreakStatus } from '../../gamification/gamification.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [NgClass, RouterModule],
  template: `
    <div class="ios-container">
      <div class="scroll-content">
        <!-- Gamification Overview -->
        <section class="stats-section">
          <div class="ios-card stat-badge current-streak">
            <div class="stat-icon-wrapper red-bg">
              <span class="icon">🔥</span>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ streak()?.currentStreak || 0 }}</span>
              <span class="stat-desc">Day Streak</span>
            </div>
          </div>
          
          <div class="ios-card stat-badge eco-points">
            <div class="stat-icon-wrapper green-bg">
              <span class="icon">🌱</span>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalPoints || 0 }}</span>
              <span class="stat-desc">Eco-Points</span>
            </div>
          </div>
        </section>

        <!-- Balances Section -->
        <section class="balances-section">
          <div class="section-header">
            <h2 class="section-title">Available Coupons</h2>
          </div>

          @if (isLoading() && balances().length === 0) {
            <div class="ios-card skeleton-card">
              <div class="shimmer"></div>
            </div>
          } @else {
            @if (balances().length === 0) {
              <div class="ios-card empty-state">
                <span class="empty-emoji">🎟️</span>
                <h3>No coupons yet</h3>
                <p>When you receive coupons, they will appear here.</p>
              </div>
            } @else {
              <div class="horizontal-scroll">
                @for (item of balances(); track item.couponTypeId || item.couponId) {
                  <div class="coupon-card" [ngClass]="getCouponClass(item.couponTypeName || item.couponName)">
                    <div class="coupon-top">
                      <span class="coupon-icon">{{ getIcon(item.couponTypeName || item.couponName) }}</span>
                      <span class="coupon-qty">x{{ item.balance }}</span>
                    </div>
                    <div class="coupon-bottom">
                      <span class="coupon-name">{{ item.couponTypeName || item.couponName }}</span>
                      <span class="coupon-sub">Digital Voucher</span>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </section>

        <!-- Quick Actions Grid -->
        <section class="actions-section">
          <h2 class="section-title">Actions</h2>
          <div class="ios-action-grid">
            <button class="ios-action-btn" routerLink="/employee/scan">
              <div class="action-icon-bg action-scan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 7V4h3"></path><path d="M20 7V4h-3"></path><path d="M4 17v3h3"></path><path d="M20 17v3h-3"></path><rect x="9" y="9" width="6" height="6"></rect>
                </svg>
              </div>
              <span class="action-label">Scan / Pay</span>
            </button>

            <button class="ios-action-btn" routerLink="/employee/transfer">
              <div class="action-icon-bg action-gift">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
              </div>
              <span class="action-label">Send Gift</span>
            </button>

            <button class="ios-action-btn" routerLink="/employee/history">
              <div class="action-icon-bg action-history">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <span class="action-label">History</span>
            </button>

            <button class="ios-action-btn" routerLink="/employee/receive-qr">
              <div class="action-icon-bg action-receive">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <span class="action-label">My QR</span>
            </button>
          </div>
        </section>
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
        padding-bottom: 2rem;
      }
      
      .ios-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 1rem 1.5rem 1rem;
        background-color: #F2F2F7;
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background-color: rgba(242, 242, 247, 0.8);
      }
      .header-titles {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .date-subtitle {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #8E8E93;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.25rem;
      }
      .large-title {
        margin: 0;
        font-size: 2.15rem;
        font-weight: 800;
        letter-spacing: 0.35px;
        color: #000;
      }
      .profile-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s;
      }
      .profile-btn:active {
        transform: scale(0.9);
      }
      .profile-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .scroll-content {
        padding: 0 0.5rem;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #000;
        margin: 1rem 0 0.5rem;
        letter-spacing: 0.3px;
      }
      
      /* Cards */
      .ios-card {
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        padding: 1rem;
      }

      /* Stats Section */
      .stats-section {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
      }
      .stat-badge {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem;
      }
      .stat-icon-wrapper {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .red-bg { background-color: rgba(255, 59, 48, 0.1); }
      .green-bg { background-color: rgba(52, 199, 89, 0.1); }
      .stat-content {
        display: flex;
        flex-direction: column;
      }
      .stat-value {
        font-size: 1.25rem;
        font-weight: 800;
        color: #000;
        line-height: 1.2;
      }
      .stat-desc {
        font-size: 0.75rem;
        color: #8E8E93;
        font-weight: 600;
      }

      /* Balances Carousel */
      .horizontal-scroll {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        padding-bottom: 1rem;
        scrollbar-width: none;
        margin: 0 -1.5rem;
        padding: 0 1.5rem 1rem;
      }
      .horizontal-scroll::-webkit-scrollbar { display: none; }
      
      .coupon-card {
        min-width: 120px;
        height: 100px;
        border-radius: 18px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #fff;
        color: white;
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        position: relative;
        overflow: hidden;
      }
      .coupon-card::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.15) 100%);
        pointer-events: none;
      }
      
      /* Colorful themes for cards */
      .theme-coffee { background: linear-gradient(135deg, #A27656 0%, #70472B 100%); }
      .theme-tea { background: linear-gradient(135deg, #5FC087 0%, #308F57 100%); }
      .theme-snack { background: linear-gradient(135deg, #F8B54D 0%, #E38600 100%); }
      .theme-default { background: linear-gradient(135deg, #6272A4 0%, #282A36 100%); }

      .coupon-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
        z-index: 2;
      }
      .coupon-icon {
        font-size: 2rem;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
      }
      .coupon-qty {
        font-size: 1.4rem;
        font-weight: 800;
        text-shadow: 0 1px 3px rgba(0,0,0,0.2);
        background: rgba(0,0,0,0.2);
        padding: 0.15rem 0.6rem;
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }
      .coupon-bottom {
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 2;
      }
      .coupon-name {
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.2px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      .coupon-sub {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
        font-weight: 500;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 3rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: 2px dashed #C7C7CC;
        border-radius: 20px;
        box-shadow: none;
      }
      .empty-emoji {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-weight: 700;
        color: #1C1C1E;
        font-size: 1.25rem;
      }
      .empty-state p {
        margin: 0;
        font-size: 0.9rem;
        color: #8E8E93;
        line-height: 1.4;
      }

      /* Skeleton */
      .skeleton-card {
        height: 160px;
        overflow: hidden;
        border-radius: 18px;
        padding: 0;
      }
      .shimmer {
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #E5E5EA 0%, #FFFFFF 50%, #E5E5EA 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
      }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

      /* Actions Grid */
      .ios-action-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      .ios-action-btn {
        background: #FFFFFF;
        border: none;
        border-radius: 18px;
        padding: 1.25rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        cursor: pointer;
        transition: transform 0.1s, opacity 0.2s;
      }
      .ios-action-btn:active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      .action-icon-bg {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .action-scan { background: linear-gradient(135deg, #5AC8FA 0%, #007AFF 100%); }
      .action-gift { background: linear-gradient(135deg, #FF9500 0%, #FF2D55 100%); }
      .action-history { background: linear-gradient(135deg, #AF52DE 0%, #5856D6 100%); }
      .action-receive { background: linear-gradient(135deg, #34C759 0%, #30B054 100%); }
      
      .action-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #1C1C1E;
      }
    `
  ]
})
export class WalletComponent implements OnInit, OnDestroy {
  balances = signal<CouponBalance[]>([]);
  userName = signal('');
  currentDate = signal(new Date());
  isLoading = signal(true);
  stats = signal<GamificationStats | null>(null);
  streak = signal<StreakStatus | null>(null);
  private sub = new Subscription();

  constructor(
    private readonly walletService: WalletService,
    private readonly authService: AuthService,
    private readonly gamificationService: GamificationService,
  ) { }

  ngOnInit() {
    this.sub.add(
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.userName.set(user.name);
          this.loadBalances();
          this.loadGamificationData();
        } else {
          this.userName.set('User');
          this.balances.set([]);
          this.stats.set(null);
          this.streak.set(null);
          this.isLoading.set(false);
        }
      }),
    );
  }

  loadBalances() {
    this.isLoading.set(true);

    this.walletService.getBalances().subscribe({
      next: (data) => {
        this.balances.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load balances', err);
        this.isLoading.set(false);
      },
    });
  }

  loadGamificationData() {
    this.gamificationService.getStats().subscribe({
      next: (data: GamificationStats) => {
        this.stats.set(data);
      },
      error: (err: Error) => console.error('Failed to load stats', err),
    });
    this.gamificationService.getStreak().subscribe({
      next: (data: StreakStatus) => {
        this.streak.set(data);
      },
      error: (err: Error) => console.error('Failed to load streak', err),
    });
  }

  getIcon(couponName: string | undefined): string {
    const name = (couponName || '').toLowerCase();
    if (name.includes('coffee')) return '☕';
    if (name.includes('tea')) return '🍵';
    if (name.includes('snack')) return '🍪';
    return '🎟️';
  }

  getCouponClass(couponName: string | undefined): string {
    const name = (couponName || '').toLowerCase();
    if (name.includes('coffee')) return 'theme-coffee';
    if (name.includes('tea')) return 'theme-tea';
    if (name.includes('snack')) return 'theme-snack';
    return 'theme-default';
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
