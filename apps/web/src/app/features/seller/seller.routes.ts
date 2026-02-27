import { Route } from '@angular/router';
import { SellerLayoutComponent } from './seller-layout/seller-layout.component';
import { QrDisplayComponent } from './qr-display/qr-display.component';
import { TransactionFeedComponent } from './transaction-feed/transaction-feed.component';
import { SummaryComponent } from './summary/summary.component';

export const SELLER_ROUTES: Route[] = [
  {
    path: '',
    component: SellerLayoutComponent,
    children: [
      { path: 'qr', component: QrDisplayComponent },
      { path: 'feed', component: TransactionFeedComponent },
      { path: 'summary', component: SummaryComponent },
      { path: '', redirectTo: 'qr', pathMatch: 'full' },
    ]
  }
];
