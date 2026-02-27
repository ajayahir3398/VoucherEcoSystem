import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
    navLinks = signal([
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'User Management', icon: '👥' },
        { path: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
        { path: '/admin/bulk-issuance', label: 'Bulk Issuance', icon: '📨' },
        { path: '/admin/config', label: 'System Config', icon: '⚙️' },
        { path: '/admin/audit', label: 'Audit Logs', icon: '📋' },
        { path: '/admin/anomalies', label: 'Anomalies', icon: '⚠️' },
        { path: '/admin/sync-conflicts', label: 'Sync Conflicts', icon: '🔄' },
        { path: '/admin/reconciliation', label: 'EOD Reconciliation', icon: '🧾' },
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
