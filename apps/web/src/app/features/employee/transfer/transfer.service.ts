import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface TransferRequest {
  senderId: string;
  recipientId: string;
  nonce: string;
  couponTypeId: string;
  quantity: number;
  deviceSignature: string;
  appreciationMessage?: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  transactionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransferService {
  constructor(private readonly apiService: ApiService) {}

  transfer(request: TransferRequest): Observable<TransferResponse> {
    return this.apiService.post<TransferResponse>('v1/transfers', request);
  }

  resolveRecipient(query: string): Observable<any[]> {
    return this.apiService.get<any[]>('v1/admin/users/search', { query });
  }
}
