import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CouponTypePayload } from '../../../core/services/admin.service';

@Component({
    selector: 'app-coupon-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './coupon-management.component.html',
    styleUrls: ['./coupon-management.component.scss']
})
export class CouponManagementComponent implements OnInit {
    coupons = signal<CouponTypePayload[]>([]);
    isModalOpen = signal(false);
    currentCoupon = signal<Partial<CouponTypePayload>>({});
    isSaving = signal(false);

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadCoupons();
    }

    loadCoupons() {
        this.adminService.getCoupons().subscribe({
            next: (res) => this.coupons.set(res),
            error: (err) => console.error('Failed to load coupons', err)
        });
    }

    openAddModal() {
        this.currentCoupon.set({ isActive: true, ecoPointsModifier: 0, co2ePerServing: 0, amount: 0 });
        this.isModalOpen.set(true);
    }

    openEditModal(coupon: CouponTypePayload) {
        this.currentCoupon.set({ ...coupon });
        this.isModalOpen.set(true);
    }

    closeAddModal() {
        this.isModalOpen.set(false);
        this.currentCoupon.set({});
    }

    saveCoupon() {
        const coupon = this.currentCoupon();
        if (!coupon.name || !coupon.description || coupon.co2ePerServing === undefined || coupon.ecoPointsModifier === undefined || coupon.amount === undefined) {
            alert('Please fill out all required fields.');
            return;
        }

        this.isSaving.set(true);

        const payload = {
            ...coupon,
            amount: parseFloat(coupon.amount as any) || 0,
            co2ePerServing: parseFloat(coupon.co2ePerServing as any) || 0,
            ecoPointsModifier: parseInt(coupon.ecoPointsModifier as any, 10) || 0
        };

        if (coupon.id) {
            const { id, ...updatePayload } = payload;
            this.adminService.updateCoupon(id!, updatePayload).subscribe({
                next: () => {
                    this.loadCoupons();
                    this.closeAddModal();
                    this.isSaving.set(false);
                },
                error: (err) => {
                    console.error('Update failed', err);
                    alert(err.error?.message || 'Failed to update coupon.');
                    this.isSaving.set(false);
                }
            });
        } else {
            this.adminService.createCoupon(payload as CouponTypePayload).subscribe({
                next: () => {
                    this.loadCoupons();
                    this.closeAddModal();
                    this.isSaving.set(false);
                },
                error: (err) => {
                    console.error('Creation failed', err);
                    alert(err.error?.message || 'Failed to create coupon.');
                    this.isSaving.set(false);
                }
            });
        }
    }

    deleteCoupon(id: string) {
        if (confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
            this.adminService.deleteCoupon(id).subscribe({
                next: () => {
                    this.loadCoupons();
                },
                error: (err) => {
                    console.error('Deletion failed', err);
                    alert(err.error?.message || 'Failed to delete coupon.');
                }
            });
        }
    }

    copyId(id: string) {
        navigator.clipboard.writeText(id).then(() => {
            alert('Coupon ID copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy ID: ', err);
            prompt('Copy the ID manually:', id);
        });
    }
}
