import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface CouponBalance {
  couponTypeId: string;
  couponTypeName: string;
  balance: number;
  couponId?: string; // Legacy support
  couponName?: string; // Legacy support
}

export interface LedgerEntry {
  id: string;
  employeeId: string;
  sellerId?: string | null;
  type: string;
  amount: number;
  quantity: number;
  refNonce?: string | null;
  couponType?: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) { }

  getBalances(): Observable<CouponBalance[]> {
    const userId = this.authService.currentUserValue?.id;
    return this.apiService.get<CouponBalance[]>(`v1/ledger/${userId}/balance`);
  }

  getHistory(params: any = {}): Observable<any> {
    const userId = this.authService.currentUserValue?.id;
    return this.apiService.get<any>(`v1/ledger/${userId}`, params);
  }
}
