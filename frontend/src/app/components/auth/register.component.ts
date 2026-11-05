import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="ocean-screen-layout">
      <div class="ocean-glass-card">
        <!-- Logo at the top of card (Screen 2) -->
        <div class="card-logo-wrap">
          <img src="assets/logo/logo.png" alt="Ocean Quest Chronicles" class="card-logo" />
        </div>

        <h2 class="card-title">SignUp</h2>
        <p class="card-subtitle">Enlist new pilot dossier in the naval fleet</p>

        <form (ngSubmit)="onSubmit()">
          <!-- Name Field -->
          <div class="field-group">
            <input 
              type="text" 
              id="name" 
              [(ngModel)]="name" 
              name="name" 
              class="field-pill" 
              placeholder="Name" 
              required 
            />
          </div>

          <!-- Username Field -->
          <div class="field-group">
            <input 
              type="text" 
              id="username" 
              [(ngModel)]="username" 
              name="username" 
              class="field-pill" 
              placeholder="Username" 
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
              placeholder="Password" 
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

          <!-- Coral Action Button -->
          <div class="btn-stack" style="margin-top: 1.4rem;">
            <button type="submit" class="btn-pill btn-coral" [disabled]="loading">
              {{ loading ? 'Enlisting...' : 'Sign Up' }}
            </button>
            <a routerLink="/" class="btn-pill btn-white">
              Back to Home
            </a>
          </div>
        </form>

        <p class="auth-switch-text">
          Already enlisted? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
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
  name = '';
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
        this.router.navigate(['/game']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to register pilot.';
      }
    });
  }
}
