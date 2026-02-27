import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import {
  RedemptionService,
  RedemptionResponse,
  RedemptionRequest,
} from '../redemption.service';
import { WalletService, CouponBalance } from '../wallet/wallet.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [RouterModule, NgClass],
  template: `
    <div class="ios-scanner-container" [ngClass]="{'bg-black': state() === 'SCANNING'}">

      <!-- Scanning State -->
      @if (state() === 'SCANNING') {
        <div class="scanning-view">
          <div class="scanner-wrapper">
            <div id="reader"></div>
            <div class="scanner-overlay">
              <div class="scan-frame">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
              </div>
            </div>
          </div>
          
          <div class="scan-instructions">
            <div class="instruction-card">
              <span class="icon">📷</span>
              <p>Align the Seller's QR code within the frame to redeem your coupon.</p>
            </div>
            
            @if (!html5QrCode?.isScanning) {
              <button (click)="startScanner()" class="ios-btn-primary mt-3">
                Enable Camera
              </button>
            }
            
            <div class="dev-tools">
              <p class="dev-title">Dev Tools</p>
              <button
                (click)="simulateScan({sellerId: 'b63cdb59-e932-4aa2-b6c2-d811e513dfab', nonce: 'a60e9a31-efc4-4cef-aded-354ca90b44c1'})"
                class="ios-btn-secondary"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Selecting Beverage State -->
      @if (state() === 'SELECTING') {
        <div class="selecting-view pb-safe">
          <div class="content-wrapper">
            <h3 class="section-heading">Available to Redeem</h3>
            
            <div class="ios-list">
              @for (item of balances(); track item.couponTypeId || item.couponId) {
                <div
                  class="ios-list-item"
                  (click)="selectBeverage(item)"
                  [class.selected]="(selectedCoupon()?.couponTypeId || selectedCoupon()?.couponId) === (item.couponTypeId || item.couponId)"
                >
                  <div class="item-icon-bg" [ngClass]="getCouponClass(item.couponTypeName || item.couponName)">
                    {{ getIcon(item.couponTypeName || item.couponName) }}
                  </div>
                  <div class="item-body">
                    <span class="item-title">{{ item.couponTypeName || item.couponName }}</span>
                    <span class="item-subtitle">Balance: {{ item.balance }}</span>
                  </div>
                  <div class="radio-circle">
                    @if ((selectedCoupon()?.couponTypeId || selectedCoupon()?.couponId) === (item.couponTypeId || item.couponId)) {
                      <div class="radio-fill"></div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          
          <div class="fixed-bottom-action">
            <div class="action-card">
              <div class="auth-hint">
                <span class="icon">🛡️</span>
                <span>Requires Face ID / Touch ID</span>
              </div>
              <button
                class="ios-btn-primary large"
                [disabled]="!selectedCoupon() || isSubmitting()"
                (click)="confirmRedemption()"
              >
                @if (isSubmitting()) {
                  <span class="spinner"></span> Processing...
                } @else {
                  Redeem {{ selectedCoupon()?.couponTypeName || selectedCoupon()?.couponName || 'Item' }}
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success State -->
      @if (state() === 'SUCCESS') {
        <div class="success-view">
          <div class="success-animation">
            <div class="circle">
              <svg viewBox="0 0 24 24" fill="none" class="check">
                <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </div>
          
          <h2 class="success-title">Payment Complete</h2>
          <p class="success-message">{{ redemptionResult()?.message }}</p>
          
          <div class="receipt-card">
            <div class="receipt-row">
              <span class="r-label">Item Total</span>
              <span class="r-value">1 Voucher</span>
            </div>
            <div class="divider"></div>
            <div class="receipt-row">
              <span class="r-label">Remaining Balance</span>
              <span class="r-value">{{ redemptionResult()?.remainingBalance }}</span>
            </div>
            <div class="divider"></div>
            <div class="receipt-row highlight">
              <span class="r-label">Streak Status</span>
              <span class="r-value">🔥 {{ redemptionResult()?.streakCount }} Days</span>
            </div>
          </div>
          
          <button class="ios-btn-primary mt-4" routerLink="/employee/home">
            Done
          </button>
        </div>
      }

      @if (errorMessage()) {
        <div class="ios-toast error">
          <span>⚠️</span>
          <p>{{ errorMessage() }}</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: #F2F2F7;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .bg-black {
        background-color: #000 !important;
      }
      .ios-scanner-container {
        max-width: 480px;
        margin: 0 auto;
        min-height: 100vh;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      /* Navigation Bar */
      .ios-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        padding-top: 1rem;
        background: rgba(242,242,247,0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        position: sticky;
        top: 0;
        z-index: 50;
        border-bottom: 0.5px solid rgba(0,0,0,0.1);
      }
      .transparent-nav {
        background: transparent;
        border-bottom: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }
      .transparent-nav .nav-title, .transparent-nav .nav-btn {
        color: white;
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
      }
      .nav-btn {
        background: none;
        border: none;
        color: #007AFF;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0;
        cursor: pointer;
        min-width: 60px;
      }
      .nav-title {
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
        color: #000;
      }

      /* Scanning View */
      .scanning-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #000;
      }
      .scanner-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      #reader {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
      }
      #reader video {
        object-fit: cover !important;
        width: 100% !important;
        height: 100% !important;
      }
      .scanner-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .scan-frame {
        width: 250px;
        height: 250px;
        position: relative;
        box-shadow: 0 0 0 4000px rgba(0,0,0,0.4); /* Darkens outside */
        border-radius: 12px;
      }
      .corner {
        position: absolute;
        width: 40px;
        height: 40px;
        border-color: #34C759;
        border-style: solid;
      }
      .top-left { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-top-left-radius: 12px; }
      .top-right { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-top-right-radius: 12px; }
      .bottom-left { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-bottom-left-radius: 12px; }
      .bottom-right { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-bottom-right-radius: 12px; }

      .scan-instructions {
        padding: 2rem 1.5rem 3rem;
        background: #1C1C1E;
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        z-index: 10;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      }
      .instruction-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(255,255,255,0.1);
        padding: 1rem;
        border-radius: 16px;
      }
      .instruction-card .icon { font-size: 1.5rem; }
      .instruction-card p {
        margin: 0;
        color: white;
        font-size: 0.85rem;
        line-height: 1.4;
      }
      .dev-tools {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .dev-title {
        color: #8E8E93;
        font-size: 0.75rem;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
        margin-top: 0;
      }

      /* Selecting View */
      .selecting-view {
        flex: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
      }
      .pb-safe { padding-bottom: 120px; }
      .section-heading {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 1rem 0.5rem;
        color: #000;
      }

      .ios-list {
        background: #FFFFFF;
        border-radius: 16px;
        overflow: hidden;
      }
      .ios-list-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        gap: 1rem;
        border-bottom: 0.5px solid #E5E5EA;
        cursor: pointer;
        transition: background 0.2s;
      }
      .ios-list-item:active { background: #F2F2F7; }
      .ios-list-item:last-child { border-bottom: none; }
      .item-icon-bg {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }
      .theme-coffee { background: linear-gradient(135deg, #A27656, #70472B); }
      .theme-tea { background: linear-gradient(135deg, #5FC087, #308F57); }
      .theme-snack { background: linear-gradient(135deg, #F8B54D, #E38600); }
      .theme-default { background: #8E8E93; }

      .item-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .item-title { font-size: 1rem; font-weight: 600; color: #000; }
      .item-subtitle { font-size: 0.8rem; color: #8E8E93; margin-top: 0.1rem; }
      
      .radio-circle {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid #C7C7CC;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ios-list-item.selected .radio-circle {
        border-color: #007AFF;
      }
      .radio-fill {
        width: 12px;
        height: 12px;
        background: #007AFF;
        border-radius: 50%;
      }

      .fixed-bottom-action {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        padding: 1rem 1.5rem 2rem;
        background: rgba(242,242,247,0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 0.5px solid rgba(0,0,0,0.1);
        z-index: 40;
        max-width: 480px;
        margin: 0 auto;
      }
      .auth-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.75rem;
        color: #8E8E93;
        font-weight: 500;
      }

      /* Buttons */
      .ios-btn-primary {
        width: 100%;
        padding: 1rem;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        transition: transform 0.1s, opacity 0.2s;
      }
      .ios-btn-primary.large { padding: 1.15rem; }
      .ios-btn-primary:active { transform: scale(0.98); opacity: 0.9; }
      .ios-btn-primary:disabled { background: #A2CFFE; cursor: not-allowed; transform: none; }
      
      .ios-btn-secondary {
        width: 100%;
        padding: 0.85rem;
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
      }
      .ios-btn-secondary:active { background: rgba(255,255,255,0.2); }

      .mt-3 { margin-top: 1rem; }
      .mt-4 { margin-top: 1.5rem; }

      /* Spinner */
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      /* Success View */
      .success-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem 1.5rem;
        text-align: center;
      }
      .success-animation {
        margin-bottom: 1.5rem;
      }
      .circle {
        width: 80px;
        height: 80px;
        background: #34C759;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(52, 199, 89, 0.4);
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .check {
        width: 40px;
        height: 40px;
        stroke-dasharray: 50;
        stroke-dashoffset: 50;
        animation: drawCheck 0.4s 0.3s ease forwards;
      }
      @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
      @keyframes drawCheck { to { stroke-dashoffset: 0; } }
      
      .success-title { font-size: 1.75rem; font-weight: 700; color: #000; margin: 0 0 0.5rem 0; }
      .success-message { font-size: 1rem; color: #8E8E93; margin: 0 0 2rem 0; }
      
      .receipt-card {
        width: 100%;
        background: white;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.03);
      }
      .receipt-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
      }
      .receipt-row.highlight {
        background: #FFF9E6;
        margin: 0 -1.25rem;
        padding: 1rem 1.25rem;
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
      }
      .r-label { font-size: 0.9rem; color: #8E8E93; }
      .r-value { font-size: 0.95rem; font-weight: 600; color: #000; }
      .divider { height: 1px; background: #E5E5EA; }

      /* Toast */
      .ios-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 100;
        width: max-content;
        max-width: 90%;
      }
      .ios-toast p { margin: 0; font-size: 0.85rem; font-weight: 500; }
    `
  ]
})
export class ScannerComponent implements OnInit, OnDestroy {
  state = signal<'SCANNING' | 'SELECTING' | 'SUCCESS'>('SCANNING');
  balances = signal<CouponBalance[]>([]);
  selectedSellerId = signal('');
  selectedNonce = signal('');
  selectedCoupon = signal<CouponBalance | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal('');
  redemptionResult = signal<RedemptionResponse | null>(null);
  html5QrCode: Html5Qrcode | null = null;

  constructor(
    private readonly walletService: WalletService,
    private readonly redemptionService: RedemptionService,
    private readonly authService: AuthService,
  ) { }

  ngOnInit() {
    this.loadBalances();
    // Auto-start scanner if camera is available
    setTimeout(() => this.startScanner(), 500);
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  startScanner() {
    if (this.html5QrCode) {
      this.stopScanner();
    }

    this.html5QrCode = new Html5Qrcode('reader');

    this.html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText, decodedResult) => this.onScanSuccess(decodedText),
        (errorMessage) => {
          // Ignore frequent scan errors
        }
      )
      .catch((err) => {
        this.showError('Could not access camera. Please allow permissions.');
        console.error('Camera startup error:', err);
      });
  }

  stopScanner() {
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode
        .stop()
        .then(() => {
          this.html5QrCode?.clear();
          this.html5QrCode = null;
        })
        .catch((err) => console.error('Error stopping scanner:', err));
    }
  }

  onScanSuccess(decodedText: string) {
    try {
      const data = JSON.parse(decodedText);

      if (!data.sellerId || !data.nonce) {
        throw new Error('Invalid QR code format');
      }

      this.stopScanner();
      this.selectedSellerId.set(data.sellerId);
      this.selectedNonce.set(data.nonce);
      this.state.set('SELECTING');
      this.errorMessage.set('');
    } catch (e) {
      console.warn('Scanned unparseable QR code:', decodedText);
    }
  }

  loadBalances() {
    this.walletService.getBalances().subscribe({
      next: (data: CouponBalance[]) =>
        this.balances.set(data.filter((b: CouponBalance) => b.balance > 0)),
      error: (err: any) => console.error('Failed to load balances', err),
    });
  }

  simulateScan(data: { sellerId: string; nonce: string }) {
    this.stopScanner();
    this.selectedSellerId.set(data.sellerId);
    this.selectedNonce.set(data.nonce);
    this.state.set('SELECTING');
  }

  selectBeverage(coupon: CouponBalance) {
    this.selectedCoupon.set(coupon);
  }

  async confirmRedemption() {
    const coupon = this.selectedCoupon();
    if (!coupon) return;

    const user = this.authService.currentUserValue;
    if (!user) {
      this.showError('You must be logged in to redeem coupons');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request: RedemptionRequest = {
      employeeId: user.id,
      sellerUUID: this.selectedSellerId(),
      nonce: this.selectedNonce(),
      couponTypeId: coupon.couponTypeId || coupon.couponId || '',
      quantity: 1,
      timestamp: new Date().toISOString(),
      deviceSignature: btoa(`employee:${user.id}:device:${navigator.userAgent}`).substring(0, 32),
      idempotencyKey: 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    };

    this.redemptionService.redeem(request).subscribe({
      next: (res: RedemptionResponse) => {
        this.redemptionResult.set(res);
        this.state.set('SUCCESS');
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        this.showError(err.error?.message || err.message || 'Redemption failed');
        this.isSubmitting.set(false);
      },
    });
  }

  showError(msg: string) {
    this.errorMessage.set(msg);
    setTimeout(() => {
      this.errorMessage.set('');
    }, 4000);
  }

  getIcon(couponName: string | undefined): string {
    const name = (couponName || '').toLowerCase();
    if (name.includes('coffee')) return '☕';
    if (name.includes('tea')) return '🍵';
    if (name.includes('snack')) return '🍪';
    return '🎟️';
  }

  getCouponClass(couponName: string | undefined): string {
    const name = (couponName || '').toLowerCase();
    if (name.includes('coffee')) return 'theme-coffee';
    if (name.includes('tea')) return 'theme-tea';
    if (name.includes('snack')) return 'theme-snack';
    return 'theme-default';
  }
}
