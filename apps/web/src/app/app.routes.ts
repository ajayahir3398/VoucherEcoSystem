import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'employee',
    canActivate: [authGuard],
    data: { roles: ['EMPLOYEE', 'ADMIN'] },
    loadChildren: () =>
      import('./features/employee/employee.routes').then(
        (m) => m.EMPLOYEE_ROUTES,
      ),
  },
  {
    path: 'seller',
    canActivate: [authGuard],
    data: { roles: ['SELLER', 'ADMIN'] },
    loadChildren: () =>
      import('./features/seller/seller.routes').then((m) => m.SELLER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'finance',
    canActivate: [authGuard],
    data: { roles: ['FINANCE', 'ADMIN'] },
    loadChildren: () =>
      import('./features/finance/finance.routes').then((m) => m.FINANCE_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
