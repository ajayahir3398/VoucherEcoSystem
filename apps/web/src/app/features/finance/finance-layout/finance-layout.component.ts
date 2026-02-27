import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-finance-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './finance-layout.component.html',
    styleUrls: ['./finance-layout.component.scss']
})
export class FinanceLayoutComponent {
    navLinks = signal([
        { path: '/finance/reconciliation', label: 'EOD Reconciliation', icon: '🧾' },
        { path: '/finance/historical', label: 'Historical Ledger', icon: '📖' },
        { path: '/finance/burn-rate', label: 'Burn Rate Analytics', icon: '📈' },
        { path: '/finance/anomalies', label: 'Anomaly Reports', icon: '⚠️' }
    ]);

    isMobileMenuOpen = signal(false);

    constructor(private router: Router, private authService: AuthService) { }

    toggleMobileMenu() {
        this.isMobileMenuOpen.update(val => !val);
    }

    closeMobileMenu() {
        this.isMobileMenuOpen.set(false);
    }

    logout() {
        this.authService.logout().subscribe(() => {
            this.router.navigate(['/auth/login']);
        });
    }
}
