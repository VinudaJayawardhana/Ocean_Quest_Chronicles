import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="ocean-screen-layout">
      <div class="ocean-glass-card">
        <!-- Logo at the top of card (Screen 3) -->
        <div class="card-logo-wrap">
          <img src="assets/logo/logo.png" alt="Ocean Quest Chronicles" class="card-logo" />
        </div>

        <h2 class="card-title">Login</h2>
        <p class="card-subtitle">Authenticate pilot credentials to initiate dive</p>

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

          <!-- Coral Action Button -->
          <div class="btn-stack" style="margin-top: 1.4rem;">
            <button type="submit" class="btn-pill btn-coral" [disabled]="loading">
              {{ loading ? 'Authenticating...' : 'Login' }}
            </button>
            <a routerLink="/" class="btn-pill btn-white">
              Back to Home
            </a>
          </div>
        </form>

        <p class="auth-switch-text">
          Don't have an account? <a routerLink="/register">Sign Up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class LoginComponent {
  identifier = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Please enter your username/email and password.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.identifier, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/game']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to authenticate.';
      }
    });
  }
}
