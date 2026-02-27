import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-sync-conflict-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="sync-conflict-container">
      <header class="section-header">
        <div>
          <h1>Sync Conflict Management</h1>
          <p>Review and resolve transactions that failed during offline synchronization.</p>
        </div>
        @if (unresolvedCount() > 0) {
          <div class="stats-badge">
            <span class="count">{{ unresolvedCount() }}</span>
            <span class="label">Unresolved Conflicts</span>
          </div>
        }
      </header>

      @if (conflicts().length > 0) {
        <div class="conflicts-grid">
          @for (conflict of conflicts(); track conflict.id) {
            <div class="conflict-card">
              <div class="conflict-status" [ngClass]="{'resolved': conflict.resolved}">
                {{ conflict.resolved ? '✓ Resolved' : '⚠ Action Required' }}
              </div>
              
              <div class="conflict-main">
                <div class="detail-row">
                  <span class="label">Seller ID:</span>
                  <span class="value">{{ conflict.sellerId }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Local TxID:</span>
                  <span class="value code">{{ conflict.localTxnId }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Reason:</span>
                  <span class="value error">{{ conflict.conflictReason }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Detected At:</span>
                  <span class="value">{{ conflict.createdAt | date:'medium' }}</span>
                </div>
              </div>

              @if (!conflict.resolved) {
                <div class="conflict-actions">
                  <div class="resolution-input">
                    <input type="text" [(ngModel)]="resolutionNotes[conflict.id]" placeholder="Add resolution note..." class="ios-input">
                  </div>
                  <div class="btn-group">
                    <button (click)="resolve(conflict.id)" class="ios-btn-primary" [disabled]="isResolving === conflict.id">
                      {{ isResolving === conflict.id ? 'Resolving...' : 'Match & Clear' }}
                    </button>
                    <button (click)="resolve(conflict.id, 'Voided by Admin')" class="ios-btn-secondary" [disabled]="isResolving === conflict.id">
                      Void Entry
                    </button>
                  </div>
                </div>
              }

              @if (conflict.resolved) {
                <div class="resolved-info">
                  <div class="detail-row">
                    <span class="label">Resolution:</span>
                    <span class="value">{{ conflict.resolution }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Resolved By:</span>
                    <span class="value code">{{ conflict.resolvedBy }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Resolved At:</span>
                    <span class="value">{{ conflict.resolvedAt | date:'medium' }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">🛡️</div>
          <h2>System Secure</h2>
          <p>No active synchronization conflicts found in the ledger.</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .sync-conflict-container {
      padding: 1rem;
      background: #f8fafc;
      min-height: 100vh;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5rem;
    }

    .section-header h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.04em;
    }

    .section-header p {
      color: #64748b;
      margin-top: 0.5rem;
      font-size: 1.15rem;
    }

    .stats-badge {
      background: #fee2e2;
      color: #991b1b;
      padding: 0.875rem 1.5rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      font-weight: 700;
      box-shadow: 0 10px 15px -3px rgba(153, 27, 27, 0.1);
      border: 1px solid #fecaca;
    }

    .stats-badge .count {
      background: #ef4444;
      color: white;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      margin-right: 0.875rem;
    }

    .conflicts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
      gap: 2rem;
    }

    .conflict-card {
      background: white;
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .conflict-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .conflict-status {
      align-self: flex-start;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.075em;
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      background: #fff7ed;
      color: #ea580c;
      margin-bottom: 1.5rem;
    }

    .conflict-status.resolved {
      background: #f0fdf4;
      color: #16a34a;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .detail-row .label {
      color: #94a3b8;
      font-weight: 600;
    }

    .detail-row .value {
      color: #334155;
      font-weight: 700;
      text-align: right;
    }

    .detail-row .value.code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
    }

    .detail-row .value.error {
      color: #e11d48;
    }

    .conflict-actions {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #f8fafc;
    }

    .resolution-input {
      margin-bottom: 1rem;
    }

    .ios-input {
      width: 100%;
      padding: 0.875rem 1.25rem;
      border: 2px solid #f1f5f9;
      border-radius: 1rem;
      background: #f8fafc;
      transition: all 0.2s ease;
      font-size: 1rem;
    }

    .ios-input:focus {
      outline: none;
      border-color: #0f172a;
      background: white;
    }

    .btn-group {
      display: flex;
      gap: 1rem;
    }

    .ios-btn-primary {
      flex: 2;
      background: #0f172a;
      color: white;
      padding: 1rem;
      border-radius: 1rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ios-btn-primary:hover:not(:disabled) {
      background: #1e293b;
      transform: translateY(-1px);
    }

    .ios-btn-secondary {
      flex: 1;
      background: #f1f5f9;
      color: #64748b;
      padding: 1rem;
      border-radius: 1rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ios-btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
      color: #334155;
    }

    .empty-state {
      text-align: center;
      padding: 8rem 2rem;
      background: white;
      border-radius: 2.5rem;
      border: 3px dashed #f1f5f9;
    }

    .empty-icon {
      font-size: 5rem;
      margin-bottom: 2rem;
      display: block;
    }

    .empty-state h2 {
      font-size: 2rem;
      color: #0f172a;
      margin-bottom: 0.75rem;
      font-weight: 800;
    }

    .empty-state p {
      color: #64748b;
      font-size: 1.2rem;
    }

    .resolved-info {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 1rem;
      border: 1px solid #f1f5f9;
    }
  `]
})
export class SyncConflictManagementComponent implements OnInit {
    conflicts = signal<any[]>([]);
    unresolvedCount = signal<number>(0);
    resolutionNotes: { [key: string]: string } = {};
    isResolving: string | null = null;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadConflicts();
    }

    loadConflicts() {
        this.adminService.getSyncConflicts().subscribe(data => {
            this.conflicts.set(data.items || []);
            this.unresolvedCount.set((data.items || []).filter((c: any) => !c.resolved).length);
        });
    }

    resolve(id: string, defaultNote?: string) {
        const note = this.resolutionNotes[id] || defaultNote || 'Matched manually by Admin';
        this.isResolving = id;
        this.adminService.resolveSyncConflict(id, note).subscribe({
            next: () => {
                this.isResolving = null;
                this.loadConflicts();
            },
            error: () => this.isResolving = null
        });
    }
}
