import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <span class="logo-icon">☕</span>
          <h1>Digital Voucher Ecosystem</h1>
          <p class="subtitle">Secure Digital Coupon Management</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          }
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" class="btn-login" [disabled]="isLoading()">
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-info">
          <p>Demo accounts (password: password123):</p>
          <ul>
            <li>Employee: rahul@company.com</li>
            <li>Seller: chai.wala@company.com</li>
            <li>Admin: admin@company.com</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        /* Apple-style gradient background */
        background: radial-gradient(circle at top left, #ebf4f5, #b5c6e0);
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .login-card {
        background: rgba(255, 255, 255, 0.65);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 20px;
        padding: 3rem 2.5rem;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      }

      .logo {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .logo-icon {
        font-size: 3.5rem;
        display: block;
        margin-bottom: 0.75rem;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
      }

      .logo h1 {
        font-size: 1.75rem;
        color: #1d1d1f;
        margin: 0;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .subtitle {
        color: #86868b;
        font-size: 0.95rem;
        margin-top: 0.35rem;
        font-weight: 400;
      }

      .error-message {
        background-color: rgba(255, 59, 48, 0.1);
        color: #ff3b30;
        padding: 0.85rem;
        border-radius: 12px;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 500;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1d1d1f;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .form-group input {
        width: 100%;
        padding: 0.85rem 1.15rem;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 12px;
        font-size: 1rem;
        color: #1d1d1f;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .form-group input:focus {
        outline: none;
        background: #ffffff;
        border-color: #007aff;
        box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
      }

      .btn-login {
        width: 100%;
        padding: 1rem;
        background: #007aff;
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 1rem;
        box-shadow: 0 4px 14px rgba(0, 122, 255, 0.3);
      }

      .btn-login:hover:not(:disabled) {
        background: #006ae6;
        transform: scale(0.98);
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
      }

      .btn-login:disabled {
        background: #99c8ff;
        box-shadow: none;
        cursor: not-allowed;
      }

      .demo-info {
        margin-top: 2.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        font-size: 0.8rem;
        color: #86868b;
        text-align: center;
      }

      .demo-info p {
        margin-bottom: 0.75rem;
        font-weight: 600;
      }

      .demo-info ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .demo-info li {
        margin-bottom: 0.35rem;
      }
    `,
  ],
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .login({ email: this.email(), password: this.password() })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.redirectBasedOnRole(response.user.role);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Login error:', err);

          let msg = 'Login failed. Please check your credentials.';
          if (err instanceof Error) {
            msg = err.message;
          } else if (typeof err === 'string') {
            msg = err;
          } else if (err?.error?.message) {
            msg = err.error.message;
          }

          this.errorMessage.set(msg);
        },
      });
  }

  private redirectBasedOnRole(role: string) {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'SELLER':
        this.router.navigate(['/seller']);
        break;
      case 'FINANCE':
        this.router.navigate(['/finance']);
        break;
      case 'EMPLOYEE':
      default:
        this.router.navigate(['/employee/home']);
        break;
    }
  }
}
