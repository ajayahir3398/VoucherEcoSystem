import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <h2>Financial Reports</h2>
      <p class="subtitle">Anomaly detection, tax exports, and analytics</p>
      <div class="report-cards">
        <div class="report-card">
          <h3>📊 Anomaly Detection</h3>
          <p>Transaction spikes, failed nonces, sync conflicts</p>
        </div>
        <div class="report-card">
          <h3>📈 Burn Rate Analytics</h3>
          <p>Issuance vs redemption trends</p>
        </div>
        <div class="report-card">
          <h3>🌿 Carbon Footprint</h3>
          <p>Scope 3 emissions by department</p>
        </div>
        <div class="report-card">
          <h3>📄 Tax Export</h3>
          <p>Compliance-ready export for tax reporting</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 1.5rem;
        max-width: 960px;
        margin: 0 auto;
      }
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a2e;
      }
      .subtitle {
        color: #6c757d;
        font-size: 0.875rem;
      }
      .report-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }
      .report-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
        cursor: pointer;
        transition: all 0.2s;
      }
      .report-card:hover {
        border-color: #667eea;
        transform: translateY(-2px);
      }
      .report-card h3 {
        font-size: 1rem;
        margin: 0 0 0.5rem;
      }
      .report-card p {
        font-size: 0.8rem;
        color: #6c757d;
        margin: 0;
      }
    `,
  ],
})
export class ReportsComponent {
  // TODO: Implement report views with chart.js or PrimeNG
}
