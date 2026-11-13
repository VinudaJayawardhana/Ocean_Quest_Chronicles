import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="ocean-screen-layout">
      <!-- Background image layer -->
      <div class="auth-bg-layer" style="background-image: url('assets/background/register_background/login_image.png');" aria-hidden="true"></div>
      <!-- Floating Fullscreen Toggle -->
      <button 
        type="button" 
        class="auth-fs-toggle" 
        (click)="toggleFullscreen()" 
        title="Toggle Fullscreen Mode"
      >
        <span>{{ isFullscreen ? '🗗 Window' : '⛶ Fullscreen' }}</span>
      </button>

      <div class="ocean-glass-card">
        <!-- Logo at the top of card -->
        <div class="card-logo-wrap">
          <img src="assets/logo/logo.png" alt="Ocean Quest Chronicles" class="card-logo" />
        </div>

        <h2 class="card-title">Pilot Login</h2>
        <p class="card-subtitle">Authenticate credentials to access naval stations and dive sectors</p>

        <form (ngSubmit)="onSubmit()">
          <!-- Username / Email Field -->
          <div class="field-group">
            <input 
              type="text" 
              id="identifier" 
              [(ngModel)]="identifier" 
              name="identifier" 
              class="field-pill" 
              placeholder="Username or Email" 
              required 
              autocomplete="username"
            />
          </div>

          <!-- Password Field -->
          <div class="field-group">
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="password" 
              name="password" 
              class="field-pill" 
              placeholder="Password" 
              required 
              autocomplete="current-password"
            />
          </div>

          <p *ngIf="errorMessage" class="error-badge">{{ errorMessage }}</p>

          <!-- Buttons -->
          <div class="btn-stack" style="margin-top: 1.4rem;">
            <button type="submit" class="btn-pill btn-coral" [disabled]="loading">
              {{ loading ? 'Authenticating...' : 'Login & Enter' }}
            </button>
            <a routerLink="/register" class="btn-pill btn-white">
              Create New Account
            </a>
          </div>
        </form>

        <p class="auth-switch-text">
          Don't have an account yet? <a routerLink="/register">Sign Up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg-layer {
      position: fixed;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
      animation: authBgDrift 22s ease-in-out infinite alternate;
    }

    @keyframes authBgDrift {
      0%   { transform: scale(1)    translate(0, 0); }
      100% { transform: scale(1.05) translate(-1%, 0.5%); }
    }

    .error-badge {
      background: rgba(239, 68, 68, 0.25);
      border: 1px solid #ef4444;
      color: #fecaca;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .auth-switch-text {
      margin-top: 1.5rem;
      font-size: 0.95rem;
      color: #c2e8fa;
    }

    .auth-switch-text a {
      color: #ffbe3b;
      font-weight: 700;
      text-decoration: underline;
      margin-left: 0.3rem;
    }

    .ocean-glass-card {
      position: relative;
      z-index: 1;
    }

    .auth-fs-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 20;
      background: rgba(3, 20, 36, 0.75);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #c2e8fa;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0.45rem 1.15rem;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .auth-fs-toggle:hover {
      background: rgba(14, 82, 119, 0.9);
      border-color: #38bdf8;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(56, 189, 248, 0.35);
    }
  `]
})
export class LoginComponent implements OnInit {
  isFullscreen = false;
  identifier = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isFullscreen = !!document.fullscreenElement;
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch(() => {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch(() => {});
    }
  }

  onSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Please enter your username/email and password.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    // Ensure fullscreen on submit
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    this.authService.login({ email: this.identifier, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to authenticate.';
      }
    });
  }
}
