import { Route } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { CouponManagementComponent } from './coupon-management/coupon-management.component';
import { SystemConfigComponent } from './system-config/system-config.component';
import { BulkIssuanceComponent } from './bulk-issuance/bulk-issuance.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { AnomalyDetectionComponent } from './anomaly-detection/anomaly-detection.component';
import { SyncConflictManagementComponent } from './sync-conflicts/sync-conflict-management.component';
import { ReconciliationComponent } from '../finance/reconciliation/reconciliation.component';

export const ADMIN_ROUTES: Route[] = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'coupons', component: CouponManagementComponent },
      { path: 'config', component: SystemConfigComponent },
      { path: 'bulk-issuance', component: BulkIssuanceComponent },
      { path: 'audit', component: AuditLogsComponent },
      { path: 'anomalies', component: AnomalyDetectionComponent },
      { path: 'sync-conflicts', component: SyncConflictManagementComponent },
      { path: 'reconciliation', component: ReconciliationComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
