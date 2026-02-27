import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { TransferService, TransferRequest } from './transfer.service';
import { WalletService, CouponBalance } from '../wallet/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [RouterModule, FormsModule, NgClass],
  template: `
    <div class="ios-container" [ngClass]="{'bg-black': step() === 2}">
      
      <!-- Step 1: Select Coupon -->
      @if (step() === 1) {
        <div class="scroll-content">
          <div class="page-header">
            <h1 class="large-title">What to send?</h1>
            <p class="subtitle">Select an item from your wallet</p>
          </div>

          <div class="ios-list mt-4">
            @if (balances().length === 0) {
              <div class="empty-state">
                <span class="icon">🎟️</span>
                <p>No coupons available to gift</p>
              </div>
            }
            @for (item of balances(); track item.couponTypeId || item.couponId) {
              <div
                class="ios-list-item"
                (click)="selectedCoupon.set(item)"
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

          <div class="fixed-bottom-action">
            <button
              class="ios-btn-primary large"
              [disabled]="!selectedCoupon()"
              (click)="goToStep2()"
            >
              Next: Choose Recipient
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Scan Recipient -->
      @if (step() === 2) {
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
              <span class="icon">📱</span>
              <p>Scan your colleague's Wallet QR to send the gift.</p>
            </div>
            
            @if (!html5QrCode?.isScanning) {
              <button (click)="startScanner()" class="ios-btn-primary mt-3">
                Enable Camera
              </button>
            }
            
            <div class="dev-tools">
              <p class="dev-title">Dev Tools</p>
              <button
                (click)="simulateRecipient('987e6543-e21b-12d3-a456-426614174000', 'Priya Sharma')"
                class="ios-btn-secondary"
              >
                Simulate Scan (Priya Sharma)
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 3: Review & Confirm -->
      @if (step() === 3) {
        <div class="scroll-content pb-safe">
          <div class="review-header">
            <div class="recipient-avatar">
              <img [src]="'https://api.dicebear.com/7.x/notionists/svg?seed=' + recipient()?.name + '&backgroundColor=f1f5f9'" alt="Avatar"/>
            </div>
            <h2 class="recipient-name">{{ recipient()?.name }}</h2>
            <p class="subtitle">Is receiving a gift from you</p>
          </div>

          <div class="ios-card summary-card">
            <div class="summary-row">
              <div class="s-left">
                <div class="s-icon" [ngClass]="getCouponClass(selectedCoupon()?.couponTypeName || selectedCoupon()?.couponName)">
                  {{ getIcon(selectedCoupon()?.couponTypeName || selectedCoupon()?.couponName) }}
                </div>
                <span class="s-title">{{ selectedCoupon()?.couponTypeName || selectedCoupon()?.couponName }}</span>
              </div>
              <span class="s-qty">x1</span>
            </div>
          </div>

          <div class="ios-form-group">
            <label class="ios-label">Personal Message (Optional)</label>
            <div class="ios-input-wrapper">
              <textarea
                class="ios-textarea"
                [ngModel]="message()"
                (ngModelChange)="message.set($event)"
                placeholder="Thanks for your help today!"
                rows="3"
              ></textarea>
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
                [disabled]="isSubmitting()"
                (click)="confirmTransfer()"
              >
                @if (isSubmitting()) {
                  <span class="spinner"></span> Sending...
                } @else {
                  Send Gift
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 4: Success -->
      @if (step() === 4) {
        <div class="success-view">
          <div class="success-animation">
            <div class="circle gift">
              <span class="gift-icon">🎁</span>
            </div>
          </div>
          
          <h2 class="success-title">Gift Sent!</h2>
          <p class="success-message">Your {{ selectedCoupon()?.couponTypeName || selectedCoupon()?.couponName }} is on its way to {{ recipient()?.name }}.</p>
          
          <div class="ios-card reward-card">
            <div class="reward-icon">⭐</div>
            <div class="reward-text">
              <h4>+15 Appreciation Stars</h4>
              <p>Earned for spreading joy</p>
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
      .bg-black { background-color: #000 !important; }
      .ios-container {
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

      /* Scroll Content */
      .scroll-content {
        padding: 0.5rem;
        flex: 1;
      }
      .pb-safe { padding-bottom: 140px; }
      
      .page-header { margin-bottom: 1.5rem; }
      .large-title {
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 0.25rem 0;
        color: #000;
        letter-spacing: 0.35px;
      }
      .subtitle {
        font-size: 0.95rem;
        color: #8E8E93;
        margin: 0;
      }

      /* Lists */
      .ios-list {
        background: #FFFFFF;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 1.5rem;
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
      .ios-list-item.selected .radio-circle { border-color: #007AFF; }
      .radio-fill {
        width: 12px;
        height: 12px;
        background: #007AFF;
        border-radius: 50%;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1.5rem;
        color: #8E8E93;
      }
      .empty-state .icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }

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
        box-shadow: 0 0 0 4000px rgba(0,0,0,0.4);
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

      /* Review Step */
      .review-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 2rem;
        margin-top: 1rem;
      }
      .recipient-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        background: white;
      }
      .recipient-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .recipient-name { font-size: 1.5rem; font-weight: 700; color: #000; margin: 0 0 0.25rem 0; }
      
      .ios-card {
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        padding: 1rem;
        margin-bottom: 1.5rem;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .s-left { display: flex; align-items: center; gap: 0.75rem; }
      .s-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: white;
      }
      .s-title { font-weight: 600; font-size: 1.05rem; color: #000; }
      .s-qty { font-weight: 700; font-size: 1.15rem; color: #007AFF; }

      .ios-form-group { margin-bottom: 1.5rem; }
      .ios-label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #8E8E93;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5rem;
        padding-left: 0.5rem;
      }
      .ios-input-wrapper {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #E5E5EA;
      }
      .ios-textarea {
        width: 100%;
        border: none;
        padding: 1rem;
        font-size: 1rem;
        font-family: inherit;
        background: transparent;
        resize: none;
        outline: none;
        box-sizing: border-box;
      }
      .ios-textarea::placeholder { color: #C7C7CC; }
      
      /* Success View */
      .success-view {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem 1.5rem;
        text-align: center;
      }
      .success-animation { margin-bottom: 1.5rem; }
      .circle.gift {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #FF9500 0%, #FF2D55 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(255, 45, 85, 0.4);
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .gift-icon { font-size: 2.5rem; color: white; }
      @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
      
      .success-title { font-size: 1.75rem; font-weight: 700; color: #000; margin: 0 0 0.5rem 0; }
      .success-message { font-size: 1rem; color: #8E8E93; margin: 0 0 2rem 0; line-height: 1.4; }
      
      .reward-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #FFF9E6;
        border: 1px solid #FFE58F;
        text-align: left;
        width: 100%;
      }
      .reward-icon { font-size: 2rem; }
      .reward-text h4 { margin: 0; color: #D46B08; font-size: 1rem; font-weight: 700; }
      .reward-text p { margin: 0; color: #FA8C16; font-size: 0.8rem; font-weight: 500; }

      /* Bottom Actions & Buttons */
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
export class TransferComponent implements OnInit, OnDestroy {
  step = signal(1);
  balances = signal<CouponBalance[]>([]);
  selectedCoupon = signal<CouponBalance | null>(null);
  recipient = signal<any>(null);
  message = signal('');
  isSubmitting = signal(false);
  errorMessage = signal('');
  html5QrCode: Html5Qrcode | null = null;

  constructor(
    private readonly walletService: WalletService,
    private readonly transferService: TransferService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  ngOnInit() {
    this.loadBalances();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  goBack() {
    if (this.step() === 1 || this.step() === 4) {
      this.router.navigate(['/employee/home']);
    } else {
      this.step.update(s => s - 1);
      if (this.step() === 2) {
        setTimeout(() => this.startScanner(), 500);
      } else {
        this.stopScanner();
      }
    }
  }

  goToStep2() {
    this.step.set(2);
    setTimeout(() => this.startScanner(), 500);
  }

  startScanner() {
    if (this.html5QrCode) {
      this.stopScanner();
    }
    this.html5QrCode = new Html5Qrcode('reader');
    this.html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText, decodedResult) => this.onScanSuccess(decodedText),
        (errorMessage) => { /* ignore */ }
      )
      .catch((err) => {
        this.showError('Could not access camera. Simulation mode available.');
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
      if (!data.employeeId || !data.nonce) throw new Error('Invalid QR code format');
      this.stopScanner();
      this.recipient.set({
        id: data.employeeId,
        name: data.name || 'Colleague',
        nonce: data.nonce
      });
      this.step.set(3);
      this.errorMessage.set('');
    } catch (e) {
      console.warn('Scanned unparseable QR:', decodedText);
    }
  }

  loadBalances() {
    this.walletService.getBalances().subscribe({
      next: (data: CouponBalance[]) =>
        this.balances.set(data.filter((b: CouponBalance) => b.balance > 0)),
      error: (err: any) => console.error('Failed to load balances', err),
    });
  }

  simulateRecipient(id: string, name: string) {
    this.stopScanner();
    this.recipient.set({ id, name, nonce: 'dummy-nonce-1234' });
    this.step.set(3);
  }

  confirmTransfer() {
    const selected = this.selectedCoupon();
    const target = this.recipient();
    if (!selected || !target) return;

    const user = this.authService.currentUserValue;
    if (!user) {
      this.showError('You must be logged in to transfer coupons');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request: TransferRequest = {
      senderId: user.id,
      recipientId: target.id,
      nonce: target.nonce,
      couponTypeId: selected.couponTypeId || selected.couponId || '',
      quantity: 1,
      deviceSignature: btoa(`employee:${user.id}:transfer:${target.id}`).substring(0, 32),
      appreciationMessage: this.message(),
    };

    this.transferService.transfer(request).subscribe({
      next: () => {
        this.step.set(4);
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        this.showError(err.error?.message || err.message || 'Transfer failed');
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
