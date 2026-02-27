import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  GamificationService,
  GamificationStats,
  StreakStatus,
} from '../gamification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterModule, NgClass],
  template: `
    <div class="ios-container">
      <div class="scroll-content">
        <div class="page-header">
          <h1 class="large-title">Dashboard</h1>
          <p class="subtitle">Your sustainability journey</p>
        </div>

        <!-- Stats Overview -->
        @if (stats()) {
          <div class="stats-section">
            <div class="ios-card stat-card primary">
              <div class="stat-icon-bg green"><span class="icon">🌱</span></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalPoints }}</span>
                <span class="stat-label">Total Eco-Points</span>
              </div>
            </div>
            
            <div class="ios-card stat-card secondary">
              <div class="stat-icon-bg blue"><span class="icon">🌍</span></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.carbonSavedKg }}<small>kg</small></span>
                <span class="stat-label">CO₂ Saved</span>
              </div>
            </div>
            
            <div class="ios-card stat-card tertiary">
              <div class="stat-icon-bg orange"><span class="icon">🎟️</span></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.redemptionsCount }}</span>
                <span class="stat-label">Items Redeemed</span>
              </div>
            </div>
          </div>
        }

        <!-- Streak Card -->
        @if (streak()) {
          <div class="ios-card streak-card">
            <div class="streak-top">
              <div class="streak-icon-bg"><span class="icon">🔥</span></div>
              <div class="streak-text">
                <h3 class="streak-title">{{ streak()?.currentStreak }} Day Streak</h3>
                <p class="streak-sub">{{ streak()?.daysToNextReward }} days to next reward</p>
              </div>
            </div>
            
            <div class="streak-progress-container">
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="((streak()?.currentStreak || 0) % 7) * 14.28"></div>
              </div>
              <div class="milestones">
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 1">M</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 2">T</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 3">W</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 4">T</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 5">F</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 6">S</span>
                <span [class.active]="((streak()?.currentStreak || 0) % 7) >= 0 && (streak()?.currentStreak || 0) > 0">S</span>
              </div>
            </div>
          </div>
        }

        <!-- Navigation Buttons -->
        <a routerLink="/employee/social/hero-board" class="ios-action-link mt-4">
          <div class="action-left">
            <div class="action-icon purple"><span class="icon">🏆</span></div>
            <div class="action-text">
              <h4>Hero Board & Badges</h4>
              <p>View your rankings</p>
            </div>
          </div>
          <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </a>

        <!-- Recent Activity -->
        @if (stats()?.recentActivity?.length) {
          <div class="activity-section">
            <h2 class="section-title">Recent Impact</h2>
            
            <div class="ios-list">
              @for (activity of stats()?.recentActivity; track activity.id) {
                <div class="ios-list-item">
                  <div class="item-icon-bg" [ngClass]="activity.type === 'REDEMPTION' ? 'redemption' : 'transfer'">
                    {{ activity.type === 'REDEMPTION' ? '☕' : '🎁' }}
                  </div>
                  
                  <div class="item-body">
                    <span class="item-title">{{ activity.title }}</span>
                    <span class="item-subtitle">{{ activity.timestamp | date: 'MMM d, h:mm a' }}</span>
                  </div>
                  
                  <div class="item-trailing">
                    <span class="item-amount">+{{ activity.points }}</span>
                    @if (activity.co2Saved > 0) {
                      <span class="item-tag">{{ activity.co2Saved }}kg CO₂</span>
                    }
                  </div>
                </div>
              }
            </div>
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
        padding-bottom: 2rem;
      }

      /* Navigation Bar */
      .ios-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        padding-top: 1rem;
        background: rgba(242,242,247,0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        position: sticky;
        top: 0;
        z-index: 50;
        border-bottom: 0.5px solid rgba(0,0,0,0.1);
      }
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

      .scroll-content { padding: 0.5rem; }
      
      .page-header { margin-bottom: 1.5rem; }
      .large-title {
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 0.25rem 0;
        color: #000;
        letter-spacing: 0.35px;
      }
      .subtitle { font-size: 0.95rem; color: #8E8E93; margin: 0; }
      .section-title { font-size: 1.25rem; font-weight: 700; color: #000; margin: 2rem 0 1rem 0; }

      /* Cards & Stats */
      .ios-card {
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .stats-section {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        margin: 0;
      }
      .stat-icon-bg {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      .stat-icon-bg.green { background: rgba(52, 199, 89, 0.15); }
      .stat-icon-bg.blue { background: rgba(0, 122, 255, 0.15); }
      .stat-icon-bg.orange { background: rgba(255, 149, 0, 0.15); }
      
      .stat-info { display: flex; flex-direction: column; }
      .stat-value { font-size: 1.5rem; font-weight: 800; color: #000; line-height: 1.2; }
      .stat-value small { font-size: 0.85rem; font-weight: 600; margin-left: 2px; }
      .stat-label { font-size: 0.8rem; color: #8E8E93; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

      /* Streak Card */
      .streak-card {
        background: linear-gradient(135deg, #FF9500 0%, #FF2D55 100%);
        color: white;
        margin-bottom: 1.5rem;
        border: none;
      }
      .streak-top {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .streak-icon-bg {
        width: 48px;
        height: 48px;
        background: rgba(255,255,255,0.2);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.75rem;
        backdrop-filter: blur(10px);
      }
      .streak-text h3 { margin: 0 0 0.25rem 0; font-size: 1.35rem; font-weight: 800; }
      .streak-text p { margin: 0; font-size: 0.85rem; opacity: 0.9; font-weight: 500; }

      .progress-track {
        height: 8px;
        background: rgba(255,255,255,0.3);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.75rem;
      }
      .progress-fill {
        height: 100%;
        background: white;
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      .milestones {
        display: flex;
        justify-content: space-between;
        padding: 0 0.25rem;
      }
      .milestones span {
        font-size: 0.7rem;
        font-weight: 700;
        opacity: 0.5;
      }
      .milestones span.active { opacity: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

      /* Action Link (iOS style button cell) */
      .ios-action-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        padding: 1.25rem;
        border-radius: 16px;
        text-decoration: none;
        box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        transition: background 0.2s;
      }
      .ios-action-link:active { background: #E5E5EA; }
      .action-left { display: flex; align-items: center; gap: 1rem; }
      .action-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .action-icon.purple { background: linear-gradient(135deg, #AF52DE 0%, #5856D6 100%); }
      .action-text h4 { margin: 0 0 0.2rem 0; font-size: 1.05rem; font-weight: 600; color: #000; }
      .action-text p { margin: 0; font-size: 0.85rem; color: #8E8E93; }
      .chevron { color: #C7C7CC; }
      .mt-4 { margin-top: 1.5rem; }

      /* List Group */
      .ios-list {
        background: #FFFFFF;
        border-radius: 16px;
        overflow: hidden;
      }
      .ios-list-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        gap: 1rem;
        border-bottom: 0.5px solid #E5E5EA;
      }
      .ios-list-item:last-child { border-bottom: none; }

      .item-icon-bg {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .item-icon-bg.redemption { background: rgba(255, 149, 0, 0.15); }
      .item-icon-bg.transfer { background: rgba(175, 82, 222, 0.15); }

      .item-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .item-title { font-size: 1rem; font-weight: 600; color: #000; margin-bottom: 0.15rem; }
      .item-subtitle { font-size: 0.8rem; color: #8E8E93; }

      .item-trailing {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }
      .item-amount { font-size: 1.05rem; font-weight: 700; color: #34C759; }
      .item-tag {
        font-size: 0.65rem;
        background: #F2F2F7;
        color: #8E8E93;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-weight: 600;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  stats = signal<GamificationStats | null>(null);
  streak = signal<StreakStatus | null>(null);

  constructor(private gamificationService: GamificationService) { }

  ngOnInit() {
    this.gamificationService
      .getStats()
      .subscribe((data) => this.stats.set(data));
    this.gamificationService
      .getStreak()
      .subscribe((data) => this.streak.set(data));
  }
}
