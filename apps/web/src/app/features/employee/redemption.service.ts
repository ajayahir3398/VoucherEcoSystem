import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface RedemptionRequest {
  employeeId: string;
  sellerUUID: string;
  nonce: string;
  couponTypeId: string;
  quantity: number;
  timestamp: string;
  deviceSignature: string;
  idempotencyKey: string;
}

export interface RedemptionResponse {
  id: string;
  status: string;
  message: string;
  remainingBalance: number;
  streakCount: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RedemptionService {
  constructor(private readonly apiService: ApiService) {}

  redeem(request: RedemptionRequest): Observable<RedemptionResponse> {
    return this.apiService.post<RedemptionResponse>('v1/redemptions', request);
  }
}
