import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-employee-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './employee-layout.component.html',
    styleUrls: ['./employee-layout.component.scss']
})
export class EmployeeLayoutComponent {
    navLinks = signal([
        { path: '/employee/home', label: 'Home', icon: '🏠' },
        { path: '/employee/scan', label: 'Scan & Pay', icon: '📷' },
        { path: '/employee/transfer', label: 'Send Gift', icon: '🎁' },
        { path: '/employee/history', label: 'History', icon: '📋' },
        { path: '/employee/social/carbon-ledger', label: 'Carbon Ledger', icon: '🍃' },
        { path: '/employee/receive-qr', label: 'My QR', icon: '📷' },
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
