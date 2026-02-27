import { Route } from '@angular/router';
import { FinanceLayoutComponent } from './finance-layout/finance-layout.component';
import { ReconciliationComponent } from './reconciliation/reconciliation.component';
import { HistoricalLedgerComponent } from './historical-ledger/historical-ledger.component';
import { BurnRateComponent } from './burn-rate/burn-rate.component';
import { AnomalyDetectionComponent } from '../admin/anomaly-detection/anomaly-detection.component';

export const FINANCE_ROUTES: Route[] = [
  {
    path: '',
    component: FinanceLayoutComponent,
    children: [
      { path: 'reconciliation', component: ReconciliationComponent },
      { path: 'historical', component: HistoricalLedgerComponent },
      { path: 'burn-rate', component: BurnRateComponent },
      { path: 'anomalies', component: AnomalyDetectionComponent },
      { path: '', redirectTo: 'reconciliation', pathMatch: 'full' }
    ]
  }
];
