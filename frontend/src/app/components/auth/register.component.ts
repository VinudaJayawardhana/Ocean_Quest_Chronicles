import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="ocean-screen-layout">
      <!-- Background image layer -->
      <div class="auth-bg-layer" style="background-image: url('assets/background/register_background/signup_image.png');" aria-hidden="true"></div>
      <!-- Floating Bubbles -->
      <div class="bubbles-layer" aria-hidden="true">
        <div class="bubble b1"></div>
        <div class="bubble b2"></div>
        <div class="bubble b3"></div>
        <div class="bubble b4"></div>
        <div class="bubble b5"></div>
        <div class="bubble b6"></div>
        <div class="bubble b7"></div>
        <div class="bubble b8"></div>
        <div class="bubble b9"></div>
        <div class="bubble b10"></div>
      </div>
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

        <h2 class="card-title">Enlist Pilot</h2>
        <p class="card-subtitle">Create new naval dossier and pilot credentials</p>

        <form (ngSubmit)="onSubmit()">
          <!-- Username Field -->
          <div class="field-group">
            <input 
              type="text" 
              id="username" 
              [(ngModel)]="username" 
              name="username" 
              class="field-pill" 
              placeholder="Pilot Callsign / Username" 
              required 
            />
          </div>

          <!-- Email Address Field -->
          <div class="field-group">
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="email" 
              name="email" 
              class="field-pill" 
              placeholder="Email Address" 
              required 
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
              placeholder="Password (min 6 chars)" 
              required 
            />
          </div>

          <!-- Auto Location Field / Button -->
          <div class="field-group">
            <div class="location-pill-wrap">
              <input 
                type="text" 
                id="location" 
                [value]="displayLocation" 
                readonly
                class="field-pill" 
                placeholder="Auto Location" 
              />
              <button 
                type="button" 
                class="location-detect-btn" 
                (click)="detectLocation()" 
                title="Detect GPS / IP Station"
              >
                📍
              </button>
            </div>
          </div>

          <p *ngIf="errorMessage" class="error-badge">{{ errorMessage }}</p>

          <!-- Buttons -->
          <div class="btn-stack" style="margin-top: 1.4rem;">
            <button type="submit" class="btn-pill btn-coral" [disabled]="loading">
              {{ loading ? 'Enlisting...' : 'Sign Up' }}
            </button>
            <a routerLink="/login" class="btn-pill btn-white">
              Already Enlisted? Login
            </a>
          </div>
        </form>

        <p class="auth-switch-text">
          Already have a naval dossier? <a routerLink="/login">Login</a>
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

    .location-pill-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .location-detect-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px;
      transition: transform 0.2s ease;
    }

    .location-detect-btn:hover {
      transform: scale(1.25);
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
  `]
})
export class RegisterComponent implements OnInit {
  isFullscreen = false;
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  userCountry = 'Sri Lanka';
  userCity = 'Colombo';
  userIp = '';

  get displayLocation(): string {
    if (this.userCity && this.userCountry) {
      return `${this.userCity}, ${this.userCountry} 🇱🇰`;
    }
    return 'Detecting Station...';
  }

  constructor(
    private authService: AuthService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.detectLocation();
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

  detectLocation(): void {
    this.locationService.getUserLocation().subscribe({
      next: (loc) => {
        if (loc.country_name) this.userCountry = loc.country_name;
        if (loc.city) this.userCity = loc.city;
        if (loc.ip) this.userIp = loc.ip;
      },
      error: () => {
        this.userCountry = 'Sri Lanka';
        this.userCity = 'Colombo';
      }
    });
  }

  onSubmit(): void {
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    // Ensure fullscreen on submit
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const payload = {
      username: this.username,
      email: this.email,
      password: this.password,
      location: {
        country: this.userCountry,
        city: this.userCity,
        ip: this.userIp
      }
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { enlisted: 'true' } });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to register pilot.';
      }
    });
  }
}
