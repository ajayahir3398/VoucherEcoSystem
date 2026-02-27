import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, CarbonLedgerEntry } from '../gamification.service';

@Component({
    selector: 'app-carbon-ledger',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="carbon-ledger-container">
      <header class="ledger-header">
        <div class="header-content">
          <h1>Carbon Ledger</h1>
          <p>Track your environmental impact, one voucher at a time.</p>
        </div>
        <div class="total-impact">
          <span class="impact-icon">🍃</span>
          <div class="impact-stats">
            <span class="impact-value">{{ totalCo2Saved() | number:'1.2-2' }} kg</span>
            <span class="impact-label">Total CO₂e Saved</span>
          </div>
        </div>
      </header>

      <div class="ledger-content">
        @if (entries().length > 0) {
          <div class="entries-list">
            @for (entry of entries(); track entry.id) {
              <div class="entry-card">
                <div class="entry-icon" [ngClass]="getEntryCategory(entry.type)">
                  {{ 
                    entry.type.includes('COFFEE') ? '☕' : 
                    (entry.type.includes('TEA') ? '🍵' : 
                    (entry.type.includes('SNACK') || entry.type.includes('COOKIE') ? '🍪' : '🎫')) 
                  }}
                </div>
                <div class="entry-details">
                  <h3>{{ entry.title }}</h3>
                  <div class="entry-meta">
                    <span class="timestamp">
                      <span class="meta-icon">📅</span>
                      {{ entry.timestamp | date:'medium' }}
                    </span>
                  </div>
                </div>
                <div class="entry-points">
                  <span class="points-value">+{{ entry.points }}</span>
                  <span class="points-label">Eco-Points</span>
                </div>
                <div class="entry-co2">
                  <span class="co2-value">{{ entry.co2Saved }} kg</span>
                  <span class="co2-label">CO₂e Saved</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="empty-icon">🍃</span>
            <h2>No impact recorded yet</h2>
            <p>Start redeeming vouchers to see your carbon savings here.</p>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .carbon-ledger-container {
      padding: 0.5rem;
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .ledger-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 2.5rem;
      border-radius: 2rem;
      color: white;
      box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2);
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.05em;
    }

    .header-content p {
      opacity: 0.95;
      margin: 0.75rem 0 0 0;
      font-size: 1.1rem;
    }

    .total-impact {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: 1.25rem 1.75rem;
      border-radius: 1.5rem;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .impact-icon {
      font-size: 2.5rem;
      margin-right: 1.25rem;
    }

    .impact-stats {
      display: flex;
      flex-direction: column;
    }

    .impact-value {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1;
    }

    .impact-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .entry-card {
      display: flex;
      align-items: center;
      background: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #f3f4f6;
    }

    .entry-card:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
      border-color: #10b981;
    }

    .entry-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0rem;
      flex-shrink: 0;
      font-size: 2rem;
      transition: transform 0.3s ease;
    }

    .entry-card:hover .entry-icon {
      transform: rotate(5deg);
    }

    .entry-icon.coffee { background: #fffbeb; }
    .entry-icon.tea { background: #ecfdf5; }
    .entry-icon.snack { background: #eff6ff; }
    .entry-icon.voucher { background: #f5f3ff; }

    .entry-details {
      flex: 1;
    }

    .entry-details h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }

    .entry-meta {
      display: flex;
      align-items: center;
      margin-top: 0.5rem;
      color: #71717a;
      font-size: 0.95rem;
    }

    .meta-icon {
      margin-right: 0.5rem;
    }

    .entry-points, .entry-co2 {
      text-align: right;
      margin-left: 2.5rem;
    }

    .points-value {
      display: block;
      font-weight: 800;
      color: #059669;
      font-size: 1.25rem;
    }

    .co2-value {
      display: block;
      font-weight: 800;
      color: #18181b;
      font-size: 1.25rem;
    }

    .points-label, .co2-label {
      font-size: 0.75rem;
      color: #a1a1aa;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .empty-state {
      text-align: center;
      padding: 6rem 2rem;
      background: #fafafa;
      border-radius: 2rem;
      border: 2px dashed #e4e4e7;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 2rem;
    }

    .empty-state h2 {
      font-size: 1.75rem;
      color: #27272a;
      margin-bottom: 0.75rem;
      font-weight: 700;
    }

    .empty-state p {
      color: #71717a;
      font-size: 1.1rem;
    }

    @media (max-width: 640px) {
      .ledger-header {
        flex-direction: column;
        text-align: center;
        padding: 2rem;
      }
      .total-impact {
        margin-top: 1.5rem;
      }
      .entry-card {
        flex-wrap: wrap;
        padding: 0.75rem;
        gap: 0.15rem;
      }
      .entry-points, .entry-co2 {
        margin-left: 0;
        margin-top: 1rem;
        flex: 1;
        text-align: left;
      }
    }
  `]
})
export class CarbonLedgerComponent implements OnInit {
    entries = signal<CarbonLedgerEntry[]>([]);
    totalCo2Saved = signal<number>(0);

    constructor(private gamificationService: GamificationService) { }

    ngOnInit() {
        this.gamificationService.getCarbonLedger().subscribe(data => {
            this.entries.set(data.entries || []);
            const total = (data.entries || []).reduce((acc, curr) => acc + curr.co2Saved, 0);
            this.totalCo2Saved.set(total);
        });
    }

    getEntryCategory(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('coffee')) return 'coffee';
        if (t.includes('tea')) return 'tea';
        if (t.includes('snack') || t.includes('cookie')) return 'snack';
        return 'voucher';
    }
}
