import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  GamificationService,
  LeaderboardEntry,
  Badge,
  StreakStatus,
} from '../gamification.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DatePipe, RouterModule],
  template: `
    <div class="gamification-container">
      <!-- Streak Section -->
      @if (streak()) {
        <section class="streak-card">
          <div class="streak-header">
            <span class="streak-icon">🔥</span>
            <div class="streak-info">
              <span class="streak-count"
                >{{ streak()?.currentStreak }} Day Streak</span
              >
              <span class="streak-hint"
                >{{ streak()?.daysToNextReward }} days to next reward</span
              >
            </div>
          </div>
          <div class="streak-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="((streak()?.currentStreak || 0) % 7) * 14.28"
              ></div>
            </div>
            <div class="milestones">
              <span>M</span><span>T</span><span>W</span><span>T</span
              ><span>F</span><span>S</span><span>S</span>
            </div>
          </div>
        </section>
      }

      <!-- Tabs -->
      <nav class="tabs">
        <button
          [class.active]="activeTab() === 'leaderboard'"
          (click)="activeTab.set('leaderboard')"
        >
          Leaderboard
        </button>
        <button
          [class.active]="activeTab() === 'badges'"
          (click)="activeTab.set('badges')"
        >
          My Badges
        </button>
      </nav>

      <!-- Leaderboard Tab -->
      @if (activeTab() === 'leaderboard') {
        <div class="tab-content">
          <div class="leaderboard-list">
            @for (entry of leaderboard(); track entry.userId; let i = $index) {
              <div class="leaderboard-item" [class.top-three]="i < 3">
                <div class="rank">{{ i + 1 }}</div>
                <div class="player-info">
                  <span class="name">{{ entry.name }}</span>
                  <span class="dept">{{ entry.department }}</span>
                </div>
                <div class="score">
                  <span class="points">{{ entry.ecoPoints }} 🌱</span>
                  <span class="label">Eco Points</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Badges Tab -->
      @if (activeTab() === 'badges') {
        <div class="tab-content">
          <div class="badges-grid">
            @for (badge of badges(); track badge.id) {
              <div class="badge-card" [class.locked]="!badge.awardedAt">
                <div class="badge-icon">{{ badge.icon }}</div>
                <span class="badge-name">{{ badge.name }}</span>
                <span class="badge-date">{{
                  badge.awardedAt
                    ? (badge.awardedAt | date: 'mediumDate')
                    : 'Locked'
                }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .gamification-container {
        padding: 1rem;
        max-width: 500px;
        margin: 0 auto;
        padding-bottom: 5rem;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .btn-back {
        background: #f1f5f9;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        font-size: 1.25rem;
        cursor: pointer;
        color: #475569;
      }
      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: #1e293b;
      }
      .header-text p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
      }

      .streak-card {
        background: linear-gradient(
          135deg,
          #ff9a9e 0%,
          #fad0c4 99%,
          #fad0c4 100%
        );
        padding: 1.25rem;
        border-radius: 20px;
        color: #fff;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 20px rgba(255, 154, 158, 0.3);
      }
      .streak-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .streak-icon {
        font-size: 2.5rem;
      }
      .streak-info {
        display: flex;
        flex-direction: column;
      }
      .streak-count {
        font-size: 1.25rem;
        font-weight: 800;
      }
      .streak-hint {
        font-size: 0.75rem;
        opacity: 0.9;
      }

      .progress-bar {
        background: rgba(255, 255, 255, 0.3);
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      .progress-fill {
        background: #fff;
        height: 100%;
        transition: width 0.5s ease-out;
      }
      .milestones {
        display: flex;
        justify-content: space-between;
        font-size: 0.65rem;
        font-weight: 700;
        opacity: 0.8;
      }

      .tabs {
        display: flex;
        background: #f1f5f9;
        padding: 0.25rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
      }
      .tabs button {
        flex: 1;
        padding: 0.6rem;
        border: none;
        background: transparent;
        border-radius: 9px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tabs button.active {
        background: white;
        color: #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .leaderboard-item {
        background: white;
        padding: 1rem;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #f1f5f9;
      }
      .rank {
        width: 32px;
        height: 32px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 800;
        color: #64748b;
      }
      .top-three .rank {
        background: #fef3c7;
        color: #d97706;
      }
      .top-three:nth-child(1) {
        border-color: #fbbf24;
        background: #fffbeb;
      }

      .player-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .name {
        font-weight: 700;
        color: #1e293b;
      }
      .dept {
        font-size: 0.75rem;
        color: #64748b;
      }

      .score {
        text-align: right;
        display: flex;
        flex-direction: column;
      }
      .points {
        font-weight: 800;
        color: #10b981;
      }
      .label {
        font-size: 0.65rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badges-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 1rem;
      }
      .badge-card {
        background: white;
        padding: 1.25rem 1rem;
        border-radius: 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid #f1f5f9;
        transition: transform 0.2s;
      }
      .badge-card:hover {
        transform: translateY(-5px);
      }
      .badge-card.locked {
        opacity: 0.5;
        filter: grayscale(1);
        background: #f8fafc;
      }
      .badge-icon {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
      }
      .badge-name {
        font-weight: 700;
        font-size: 0.85rem;
        color: #1e293b;
        line-height: 1.2;
      }
      .badge-date {
        font-size: 0.65rem;
        color: #94a3b8;
        margin-top: 0.4rem;
      }
    `,
  ],
})
export class LeaderboardComponent implements OnInit {
  leaderboard = signal<LeaderboardEntry[]>([]);
  badges = signal<Badge[]>([]);
  streak = signal<StreakStatus | null>(null);
  activeTab = signal<'leaderboard' | 'badges'>('leaderboard');

  constructor(private readonly gamificationService: GamificationService) { }

  ngOnInit() {
    this.gamificationService
      .getLeaderboard()
      .subscribe((data) => this.leaderboard.set(data));
    this.gamificationService
      .getBadges()
      .subscribe((data) => this.badges.set(data));
    this.gamificationService
      .getStreak()
      .subscribe((data) => this.streak.set(data));
  }
}
