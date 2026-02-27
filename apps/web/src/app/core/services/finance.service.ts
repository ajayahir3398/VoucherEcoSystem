import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LedgerEntryPayload {
    id: string;
    employeeId: string;
    employeeName?: string;
    sellerId?: string;
    sellerName?: string;
    type: string;
    amount: number;
    quantity: number;
    refNonce?: string;
    createdAt: string;
}

export interface PaginatedLedgerResponse {
    items: LedgerEntryPayload[];
    total: number;
    page: number;
    limit: number;
}

export interface BurnRateTrend {
    date: string;
    amount: number;
}

export interface BurnRateResponse {
    issuanceTrends: BurnRateTrend[];
    redemptionTrends: BurnRateTrend[];
}

@Injectable({
    providedIn: 'root'
})
export class FinanceService {
    private apiUrl = `${environment.apiUrl}/api/v1`;

    constructor(private http: HttpClient) { }

    getAllLedgerEntries(page = 1, limit = 20, type?: string, startDate?: string, endDate?: string): Observable<PaginatedLedgerResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (type) params = params.set('type', type);
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get<PaginatedLedgerResponse>(`${this.apiUrl}/ledger`, { params });
    }

    getBurnRateAnalytics(): Observable<BurnRateResponse> {
        return this.http.get<BurnRateResponse>(`${this.apiUrl}/reports/burn-rate`);
    }
}
