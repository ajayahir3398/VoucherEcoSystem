import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-seller-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './seller-layout.component.html',
    styleUrls: ['./seller-layout.component.scss']
})
export class SellerLayoutComponent {
    navLinks = signal([
        { path: '/seller/qr', label: 'My QR Code', icon: '📱' },
        { path: '/seller/feed', label: 'Redemption Feed', icon: '📋' },
        { path: '/seller/summary', label: 'Daily Summary', icon: '📊' },
    ]);

    isMobileMenuOpen = signal(false);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    constructor() { }

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
