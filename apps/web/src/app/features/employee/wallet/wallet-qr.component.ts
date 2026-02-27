import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-wallet-qr',
  standalone: true,
  imports: [RouterModule, QRCodeComponent],
  template: `
    <div class="ios-container">
     
      <div class="scroll-content">
        <div class="page-header">
          <h1 class="large-title">My QR Code</h1>
          <p class="subtitle">Have a colleague scan this code to send you a gift coupon.</p>
        </div>

        <div class="ios-card qr-card mt-4">
          <div class="qr-wrapper">
            @if (qrData()) {
              <qrcode
                [qrdata]="qrData()"
                [width]="240"
                [errorCorrectionLevel]="'M'"
                [colorDark]="'#000000'"
                [colorLight]="'#ffffff'"
              ></qrcode>
            } @else {
              <div class="loading-state">
                <div class="ios-spinner"></div>
                <p>Generating QR...</p>
              </div>
            }
          </div>

          <div class="info-box">
            @if (user()) {
              <div class="user-avatar">
                <img [src]="'https://api.dicebear.com/7.x/notionists/svg?seed=' + user()?.name + '&backgroundColor=f1f5f9'" alt="Avatar"/>
              </div>
              <h3 class="name">{{ user()?.name }}</h3>
              <p class="dept">{{ user()?.department || 'Employee' }}</p>
            }
          </div>
          
          <div class="security-note">
            <div class="icon-bg"><span class="icon">🔒</span></div>
            <p>This QR code refreshes automatically for your security.</p>
          </div>
        </div>
      </div>
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
      .ios-container {
        max-width: 480px;
        margin: 0 auto;
        min-height: 100vh;
      }

      /* Navigation Bar */
      .ios-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        padding-top: 3rem;
        background: rgba(242,242,247,0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        position: sticky;
        top: 0;
        z-index: 50;
        border-bottom: 0.5px solid rgba(0,0,0,0.1);
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
      }
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
        line-height: 1.4;
      }

      .ios-card {
        border-radius: 20px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        padding: 1.5rem;
        padding-top: 0rem;
      }
      .mt-4 { margin-top: 1.5rem; }

      .qr-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .qr-wrapper {
        background: white;
        padding: 1rem;
        border-radius: 24px;
        border: 1px solid #E5E5EA;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        width: 260px;
        height: 260px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: #8E8E93;
      }
      .ios-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(0,0,0,0.1);
        border-top: 3px solid #8E8E93;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      .info-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 2rem;
      }
      .user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        margin-bottom: 0.75rem;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        background: #f1f5f9;
      }
      .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
      
      .name {
        font-size: 1.25rem;
        font-weight: 700;
        color: #000;
        margin: 0 0 0.25rem 0;
      }
      .dept {
        color: #8E8E93;
        font-size: 0.85rem;
        margin: 0;
        font-weight: 500;
      }

      .security-note {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #F2F2F7;
        padding: 1rem;
        border-radius: 12px;
        text-align: left;
        width: 100%;
        box-sizing: border-box;
      }
      .icon-bg {
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        flex-shrink: 0;
      }
      .security-note .icon {
        font-size: 0.85rem;
      }
      .security-note p {
        margin: 0;
        color: #8E8E93;
        font-size: 0.8rem;
        line-height: 1.4;
      }
    `
  ]
})
export class WalletQrComponent implements OnInit {
  qrData = signal('');
  user = signal<any>(null);

  constructor(private readonly authService: AuthService) { }

  ngOnInit() {
    this.user.set(this.authService.currentUserValue);
    this.generateQr();

    // Refresh QR every 30 seconds
    setInterval(() => this.generateQr(), 30000);
  }

  generateQr() {
    const currentUser = this.user();
    if (!currentUser) return;

    const payload = {
      employeeId: currentUser.id,
      name: currentUser.name,
      nonce: 'rcv-' + crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.qrData.set(JSON.stringify(payload));
  }
}
