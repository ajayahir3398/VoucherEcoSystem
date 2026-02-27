import { Route } from '@angular/router';
import { WalletComponent } from './wallet/wallet.component';
import { ScannerComponent } from './scanner/scanner.component';
import { HistoryComponent } from './history/history.component';
import { TransferComponent } from './transfer/transfer.component';
import { WalletQrComponent } from './wallet/wallet-qr.component';
import { EmployeeLayoutComponent } from './employee-layout/employee-layout.component';

export const EMPLOYEE_ROUTES: Route[] = [
  {
    path: '',
    component: EmployeeLayoutComponent,
    children: [
      { path: 'home', component: WalletComponent },
      { path: 'scan', component: ScannerComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'transfer', component: TransferComponent },
      { path: 'receive-qr', component: WalletQrComponent },
      {
        path: 'social',
        loadChildren: () =>
          import('../gamification/gamification.routes').then(
            (m) => m.GAMIFICATION_ROUTES,
          ),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  }
];
