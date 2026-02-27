import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from '@angular/core';
import * as QRCode from 'qrcode';
import { CommonModule } from '@angular/common';
import { SellerService, QrData } from '../seller.service';
import { timer, map, takeWhile, tap, repeat, switchMap, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qr-container">
      <header>
        <h2>Your Seller QR Code</h2>
        <p class="subtitle">Employees scan this to redeem coupons</p>
      </header>

      <div class="qr-card">
        <div class="qr-viewport" [class.loading]="isLoading()">
          <canvas
            #qrCanvas
            [hidden]="!qrData() || isLoading()"
            class="qr-canvas"
          ></canvas>
          @if (qrData() && !isLoading()) {
            <div class="qr-display"></div>
          }
          @if (isLoading()) {
            <div class="spinner">Generating...</div>
          }
        </div>

        <div class="qr-info">
          <div class="info-item">
            <span class="label">Status</span>
            <span class="value active">Live</span>
          </div>
          <div class="info-item">
            <span class="label">Refreshes In</span>
            <span class="value">{{ refreshCountdown() }}s</span>
          </div>
        </div>

        <button class="btn-refresh" (click)="loadQr()" [disabled]="isLoading()">
          🔄 Force Refresh
        </button>
      </div>

      <div class="otp-section">
        <h3>Manual OTP Fallback</h3>
        <div class="otp-display">
          @if (qrData()?.otp) {
            {{ qrData()!.otp }}
          } @else {
            ------
          }
        </div>
        <p class="hint">
          Share this OTP if the employee's camera is unavailable
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .qr-container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
      }
      header {
        text-align: left;
        margin-bottom: 2rem;
      }
      header h2 {
        font-size: 24px;
        font-weight: 700;
        color: var(--apple-text-primary);
        margin: 0;
      }
      .subtitle {
        color: var(--apple-text-secondary);
        font-size: 15px;
        margin-top: 4px;
      }

      .qr-card {
        margin: 2rem 0;
        background: white;
        border-radius: var(--apple-radius-lg);
        padding: 32px;
        box-shadow: var(--apple-shadow-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .qr-viewport {
        width: 220px;
        height: 220px;
        background: #fdfdfd;
        border-radius: var(--apple-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(0,0,0,0.05);
        position: relative;
      }

      .qr-canvas {
        width: 180px !important;
        height: 180px !important;
      }

      .spinner {
        color: var(--apple-blue);
        font-weight: 600;
      }

      .qr-info {
        display: flex;
        width: 100%;
        justify-content: space-around;
        margin: 24px 0;
      }
      .info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .label {
        font-size: 12px;
        color: var(--apple-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .value {
        font-weight: 600;
        color: var(--apple-text-primary);
        margin-top: 4px;
        font-size: 16px;
      }
      .value.active {
        color: #34c759; /* Apple Green */
      }

      .btn-refresh {
        width: 100%;
        padding: 14px;
        background: rgba(0,0,0,0.03);
        border: none;
        border-radius: var(--apple-radius-md);
        cursor: pointer;
        font-weight: 600;
        color: var(--apple-text-primary);
        transition: all 0.2s;
        font-size: 15px;
      }
      .btn-refresh:hover:not(:disabled) {
        background: rgba(0,0,0,0.06);
      }

      .otp-section {
        margin-top: 32px;
        background: white;
        padding: 24px;
        border-radius: var(--apple-radius-lg);
        box-shadow: var(--apple-shadow-lg);
      }
      h3 {
        font-size: 14px;
        font-weight: 600;
        color: var(--apple-text-secondary);
        margin-bottom: 8px;
        text-align: center;
      }
      .otp-display {
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 8px;
        color: var(--apple-blue);
        margin: 12px 0;
        text-align: center;
        font-family: 'SF Mono', 'Courier New', monospace;
      }
      .hint {
        font-size: 13px;
        color: var(--apple-text-secondary);
        text-align: center;
        margin-top: 8px;
      }
    `,
  ],
})
export class QrDisplayComponent {
  @ViewChild('qrCanvas') set qrCanvas(content: ElementRef<HTMLCanvasElement>) {
    if (content) {
      this._qrCanvas = content;
      this.renderQr();
    }
  }
  private _qrCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly sellerService = inject(SellerService);

  // Countdown signal (resets every 600s)
  refreshCountdown = toSignal(
    timer(0, 1000).pipe(
      map(v => 600 - (v % 601)),
      tap(v => {
        if (v === 600) this.loadQr();
      })
    ),
    { initialValue: 600 }
  );

  qrData = signal<QrData | null>(null);
  isLoading = signal(false);

  constructor() { }

  loadQr() {
    this.isLoading.set(true);
    this.sellerService.generateQr().subscribe({
      next: (data) => {
        this.qrData.set(data);
        this.isLoading.set(false);
        this.renderQr();
      },
      error: (err) => {
        console.error('Failed to generate QR', err);
        this.isLoading.set(false);
      },
    });
  }

  private renderQr() {
    const data = this.qrData();
    if (data && this._qrCanvas?.nativeElement) {
      QRCode.toCanvas(
        this._qrCanvas.nativeElement,
        data.qrString,
        { width: 160, margin: 1 },
        (error: Error | null | undefined) => {
          if (error) console.error('QR rendering error:', error);
        },
      );
    }
  }
}
