import { Route } from '@angular/router';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CarbonLedgerComponent } from './carbon-ledger/carbon-ledger.component';

export const GAMIFICATION_ROUTES: Route[] = [
  { path: '', component: DashboardComponent },
  { path: 'hero-board', component: LeaderboardComponent },
  { path: 'carbon-ledger', component: CarbonLedgerComponent },
];
