import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BulkIssuePayload {
    items: { employeeId: string; couponTypeId: string; quantity: number }[];
}

export interface UserPayload {
    id?: string;
    email: string;
    name: string;
    role: 'EMPLOYEE' | 'SELLER' | 'ADMIN' | 'FINANCE';
    isActive?: boolean;
    createdAt?: string;
    password?: string;
}

export interface SystemConfigPayload {
    key: string;
    value: any;
    description?: string;
}

export interface CouponTypePayload {
    id?: string;
    name: string;
    description: string;
    amount: number;
    co2ePerServing: number;
    ecoPointsModifier: number;
    isActive?: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface OperationalDashboardData {
    liveTransactions: any[];
    activeSellers: number;
    pendingSyncQueueDepth: number;
    todayRedemptions: number;
}

export interface AnalyticalDashboardData {
    beverageTrends: { couponTypeId: string, day: string, total: string }[];
    peakHourHeatMap: { hour: number, dayOfWeek: number, count: number }[];
    p2pTransferFrequency: number;
    carbonFootprintByDepartment: { department: string, totalEcoPoints: number, employeeCount: number }[];
}

export interface StrategicDashboardData {
    totalIssuance: number;
    totalRedemption: number;
    burnRate: number;
    programROI: number;
    totalEmployees: number;
    activeEmployees: number;
    adoptionRate: number;
}

export interface AnomalyReportPayload {
    anomalies: {
        type: string;
        employeeId: string;
        count: number;
        mean: number;
        stddev: number;
        threshold: number;
    }[];
    failedNonceAttempts: number;
    syncConflicts: { id: string, entityType: string, status: string, createdAt: string, resolved: boolean }[];
    generatedAt: string;
}

export interface EodReportPayload {
    date: string;
    totalRedemptions: number;
    totalLedgerEntries: number;
    matchedTransactions: number;
    exceptionItemCount: number;
    exceptionItems: { type: string, id: string, nonce?: string, employeeId?: string, sellerId?: string, quantity?: number, amount?: string, timestamp: string }[];
    reconciledAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private adminApiUrl = `${environment.apiUrl}/api/v1/admin`;
    private reportsApiUrl = `${environment.apiUrl}/api/v1/reports`;

    constructor(private http: HttpClient) { }

    bulkIssueCoupons(payload: BulkIssuePayload): Observable<{ success: boolean; totalIssued: number }> {
        return this.http.post<{ success: boolean; totalIssued: number }>(`${this.adminApiUrl}/coupons/bulk-issue`, payload);
    }

    getDashboardStats(): Observable<{ totalUsers: number, activeSellers: number, todaysRedemptions: number, pendingSyncs: number }> {
        return this.http.get<{ totalUsers: number, activeSellers: number, todaysRedemptions: number, pendingSyncs: number }>(`${this.adminApiUrl}/dashboard-stats`);
    }

    getOperationalDashboard(): Observable<OperationalDashboardData> {
        return this.http.get<OperationalDashboardData>(`${this.reportsApiUrl}/dashboard/operational`);
    }

    getAnalyticalDashboard(): Observable<AnalyticalDashboardData> {
        return this.http.get<AnalyticalDashboardData>(`${this.reportsApiUrl}/dashboard/analytical`);
    }

    getStrategicDashboard(): Observable<StrategicDashboardData> {
        return this.http.get<StrategicDashboardData>(`${this.reportsApiUrl}/dashboard/strategic`);
    }

    getAnomalies(): Observable<AnomalyReportPayload> {
        return this.http.get<AnomalyReportPayload>(`${this.reportsApiUrl}/anomalies`);
    }

    getEodReport(date?: string): Observable<EodReportPayload> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<EodReportPayload>(`${this.reportsApiUrl}/eod`, { params });
    }

    downloadTaxExport(date: string): Observable<Blob> {
        const params = new HttpParams().set('date', date);
        return this.http.get(`${this.reportsApiUrl}/tax-export`, {
            params,
            responseType: 'blob'
        });
    }

    getUsers(role?: string, page = 1, limit = 20): Observable<PaginatedResult<UserPayload>> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        if (role) {
            params = params.set('role', role);
        }
        return this.http.get<PaginatedResult<UserPayload>>(`${this.adminApiUrl}/users`, { params });
    }

    createUser(payload: UserPayload): Observable<UserPayload> {
        return this.http.post<UserPayload>(`${this.adminApiUrl}/users`, payload);
    }

    updateUser(id: string, payload: Partial<UserPayload>): Observable<UserPayload> {
        return this.http.patch<UserPayload>(`${this.adminApiUrl}/users/${id}`, payload);
    }

    getConfig(): Observable<SystemConfigPayload[]> {
        return this.http.get<SystemConfigPayload[]>(`${this.adminApiUrl}/config`);
    }

    updateConfig(payload: SystemConfigPayload): Observable<SystemConfigPayload> {
        return this.http.patch<SystemConfigPayload>(`${this.adminApiUrl}/config`, payload);
    }

    getAuditLogs(page = 1, limit = 20): Observable<PaginatedResult<any>> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<PaginatedResult<any>>(`${this.adminApiUrl}/audit-logs`, { params });
    }

    // --- Coupon Management ---

    getCoupons(): Observable<CouponTypePayload[]> {
        return this.http.get<CouponTypePayload[]>(`${this.adminApiUrl}/coupons`);
    }

    createCoupon(payload: CouponTypePayload): Observable<CouponTypePayload> {
        return this.http.post<CouponTypePayload>(`${this.adminApiUrl}/coupons`, payload);
    }

    updateCoupon(id: string, payload: Partial<CouponTypePayload>): Observable<CouponTypePayload> {
        return this.http.patch<CouponTypePayload>(`${this.adminApiUrl}/coupons/${id}`, payload);
    }

    deleteCoupon(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.adminApiUrl}/coupons/${id}`);
    }

    // --- Sync Conflict Management ---

    getSyncConflicts(page = 1, limit = 20): Observable<PaginatedResult<any>> {
        const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        return this.http.get<PaginatedResult<any>>(`${this.adminApiUrl}/sync-conflicts`, { params });
    }

    resolveSyncConflict(id: string, note: string): Observable<any> {
        return this.http.patch<any>(`${this.adminApiUrl}/sync-conflicts/${id}/resolve`, { note });
    }
}
