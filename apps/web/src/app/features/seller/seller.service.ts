import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface QrData {
  sellerId: string;
  nonce: string;
  otp: string;
  hmac: string;
  expiresAt: string;
  qrString: string;
}

export interface SellerSummary {
  date: string;
  totalCount: number;
  totalAmount: number;
  totalCo2Saved: number;
  transactionCount: number;
}

export interface SellerTransaction {
  id: string;
  couponName: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  createdAt: string;
  ecoPointsEarned: number;
}

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  constructor(private readonly apiService: ApiService) { }

  generateQr(): Observable<QrData> {
    return this.apiService.get<any>('v1/seller/qr').pipe(
      map((res) => ({
        sellerId: res.sellerUUID,
        nonce: res.nonce,
        otp: res.otp,
        hmac: res.hmacSignature,
        expiresAt: res.expiresAt,
        qrString: JSON.stringify({
          sellerUUID: res.sellerUUID,
          nonce: res.nonce,
          hmacSignature: res.hmacSignature,
          expiresAt: res.expiresAt,
        }),
      })),
    );
  }

  getFeed(limit = 20): Observable<SellerTransaction[]> {
    return this.apiService.get<SellerTransaction[]>('v1/seller/feed', {
      limit,
    });
  }

  getSummary(date?: string): Observable<SellerSummary> {
    return this.apiService.get<SellerSummary>('v1/seller/summary', { date });
  }
}
