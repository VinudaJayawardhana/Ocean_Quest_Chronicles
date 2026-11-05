import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-screen-container">
      <!-- Top Profile Navigation Icon (as shown on Screen 1) -->
      <div class="home-top-nav">
        <a [routerLink]="authService.isLoggedIn() ? '/profile' : '/login'" class="profile-avatar-btn" title="Pilot Profile">
          <div class="avatar-circle">
            <span class="avatar-icon">🤿</span>
          </div>
          <span class="avatar-label">Profile</span>
        </a>
      </div>

      <!-- Main Hub Container -->
      <main class="home-content-wrap">
        <!-- Main Logo (Centered) -->
        <div class="logo-hero-container">
          <img 
            src="assets/logo/logo.png" 
            alt="Ocean Quest Chronicles" 
            class="home-hero-logo" 
          />
        </div>

        <!-- Action Buttons (Screen 1) -->
        <div class="home-menu-stack">
          <button class="btn-pill btn-coral btn-hero" (click)="startGame()">
            Start Game
          </button>
          <button class="btn-pill btn-white btn-hero" (click)="showHighestScore()">
            Highest Score
          </button>
          <button class="btn-pill btn-white btn-hero" (click)="goToLeaderboard()">
            Leaderboard
          </button>
          <button class="btn-pill btn-ice btn-settings" (click)="openSettings()">
            ⚙ Game Settings
          </button>
        </div>
      </main>

      <!-- Highest Score Modal Popup -->
      <div class="highest-score-overlay" *ngIf="isHighScoreModalOpen" (click)="closeHighScoreModal()">
        <div class="ocean-glass-card" (click)="$event.stopPropagation()">
          <h2 class="card-title">⭐ PERSONAL BEST</h2>
          <div class="highlight-pill-banner">
            CURRENT RECORD: {{ bestScore }} PTS
          </div>
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">PILOT CALL-SIGN</span>
              <span class="stat-val">{{ pilotCallsign || 'DeepDiver_99' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">HIGHEST SECTOR</span>
              <span class="stat-val">Level 2 (Pirate Cove)</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MAX DEPTH REACHED</span>
              <span class="stat-val">{{ maxDepth }}m</span>
            </div>
          </div>
          <div class="btn-row" style="margin-top: 1.5rem;">
            <button class="btn-pill btn-coral" (click)="startGame()">DIVE IN</button>
            <button class="btn-pill btn-white" (click)="closeHighScoreModal()">CLOSE</button>
          </div>
        </div>
      </div>

      <!-- First-Time Pilot Welcome & Briefing Modal -->
      <div class="welcome-overlay" *ngIf="isWelcomeModalOpen" (click)="dismissWelcome()">
        <div class="ocean-glass-card welcome-card animate-scale-up" (click)="$event.stopPropagation()">
          <div class="welcome-badge-pill">
            🌊 EXPEDITION DISPATCH
          </div>
          
          <h2 class="welcome-title">WELCOME ABOARD!</h2>
          <p class="welcome-subtitle">
            Greetings, <strong>{{ pilotCallsign || 'Deep Sea Explorer' }}</strong>! Your underwater mission begins now.
          </p>

          <!-- 3-Step Animated Briefing Cards -->
          <div class="briefing-grid">
            <div class="briefing-step">
              <div class="step-icon">🫧</div>
              <div class="step-title">1. Breathe</div>
              <div class="step-desc">Collect oxygen bubbles before your danger meter fills up.</div>
            </div>
            <div class="briefing-step">
              <div class="step-icon">🦈</div>
              <div class="step-title">2. Evade</div>
              <div class="step-desc">Steer clear of aggressive reef sharks and pirate raiders.</div>
            </div>
            <div class="briefing-step">
              <div class="step-icon">🧭</div>
              <div class="step-title">3. Solve</div>
              <div class="step-desc">Memorize fish patterns for 5s, then crack the sonar enigma!</div>
            </div>
          </div>

          <div class="welcome-actions">
            <button class="btn-pill btn-coral btn-dive-launch" (click)="launchFirstDive()">
              🤿 DIVE INTO THE DEEP
            </button>
            <button class="btn-pill btn-white btn-dismiss" (click)="dismissWelcome()">
              EXPLORE HUB FIRST
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Modal (Screen 4) -->
      <app-settings-modal 
        *ngIf="isSettingsOpen" 
        [visible]="isSettingsOpen" 
        (close)="closeSettings()"
      ></app-settings-modal>
    </div>
  `,
  styles: [`
    .home-screen-container {
      position: relative;
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem 1.5rem 4rem 1.5rem;
      z-index: 5;
    }

    .home-top-nav {
      position: absolute;
      top: 1.2rem;
      right: 2rem;
      z-index: 10;
    }

    .profile-avatar-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #ffffff;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .profile-avatar-btn:hover {
      transform: scale(1.1) translateY(-2px);
    }

    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(145deg, #ffffff, #e0f4ff);
      border: 2.5px solid #38bdf8;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }

    .profile-avatar-btn:hover .avatar-circle {
      border-color: #ff7b54;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 5px rgba(255, 123, 84, 0.25);
    }

    .avatar-icon {
      font-size: 1.55rem;
    }

    .avatar-label {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.6px;
      margin-top: 0.3rem;
      color: #c2e8fa;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .home-content-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }

    .logo-hero-container {
      margin-bottom: 2.2rem;
    }

    .home-hero-logo {
      width: 290px;
      max-width: 90vw;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 14px 28px rgba(3, 20, 36, 0.55)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.22));
      animation: floatLogo 4.5s ease-in-out infinite alternate;
      transition: filter 0.4s ease;
    }

    .home-hero-logo:hover {
      filter: drop-shadow(0 18px 36px rgba(3, 20, 36, 0.65)) drop-shadow(0 0 30px rgba(56, 189, 248, 0.45));
    }

    @keyframes floatLogo {
      0%   { transform: translateY(0) rotate(-0.5deg); }
      50%  { transform: translateY(-6px) rotate(0deg); }
      100% { transform: translateY(-10px) rotate(0.5deg); }
    }

    .home-menu-stack {
      display: flex;
      flex-direction: column;
      gap: 1.05rem;
      width: 100%;
      max-width: 340px;
    }

    /* Staggered entrance animation for menu buttons */
    .home-menu-stack .btn-pill {
      animation: slideUpFade 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .home-menu-stack .btn-pill:nth-child(1) { animation-delay: 0.05s; }
    .home-menu-stack .btn-pill:nth-child(2) { animation-delay: 0.12s; }
    .home-menu-stack .btn-pill:nth-child(3) { animation-delay: 0.19s; }
    .home-menu-stack .btn-pill:nth-child(4) { animation-delay: 0.26s; }

    @keyframes slideUpFade {
      from { transform: translateY(18px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .btn-hero {
      width: 100%;
      font-size: 1.15rem;
      padding: 1rem 2rem;
    }

    .btn-settings {
      margin-top: 0.3rem;
      font-size: 0.95rem;
      padding: 0.65rem 1.5rem;
    }

    .highest-score-overlay,
    .welcome-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(2, 12, 26, 0.85);
      backdrop-filter: blur(16px) saturate(1.3);
      -webkit-backdrop-filter: blur(16px) saturate(1.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.2rem;
      animation: fadeInOverlay 0.3s ease;
    }

    .welcome-card {
      max-width: 520px;
      padding: 2.5rem 2.2rem;
      border: 1.5px solid rgba(56, 189, 248, 0.4);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.25);
    }

    .welcome-badge-pill {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #e0f2fe;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 0.35rem 1.2rem;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: 0.8rem;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    }

    .welcome-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
      margin-bottom: 0.4rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.4);
    }

    .welcome-subtitle {
      font-size: 0.95rem;
      color: #bae6fd;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }

    .briefing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.8rem;
    }

    .briefing-step {
      background: rgba(3, 25, 48, 0.65);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 16px;
      padding: 0.9rem 0.6rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .briefing-step:hover {
      transform: translateY(-3px);
      border-color: rgba(56, 189, 248, 0.6);
      background: rgba(3, 35, 65, 0.8);
    }

    .step-icon {
      font-size: 2rem;
      margin-bottom: 0.4rem;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    }

    .step-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .step-desc {
      font-size: 0.72rem;
      color: #94a3b8;
      line-height: 1.35;
      font-family: var(--font-body);
    }

    .welcome-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-dive-launch {
      font-size: 1.15rem;
      padding: 0.95rem 2rem;
      animation: pulseCoral 2s infinite alternate;
    }

    @keyframes pulseCoral {
      0% { box-shadow: 0 6px 20px rgba(255, 90, 60, 0.45); }
      100% { box-shadow: 0 10px 30px rgba(255, 90, 60, 0.85); transform: translateY(-1px); }
    }

    .btn-dismiss {
      font-size: 0.9rem;
      padding: 0.65rem 1.5rem;
    }

    .animate-scale-up {
      animation: scaleUpAnim 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes scaleUpAnim {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 600px) {
      .briefing-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      .briefing-step {
        padding: 0.6rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  isSettingsOpen = false;
  isHighScoreModalOpen = false;
  isWelcomeModalOpen = false;
  bestScore = 1850;
  pilotCallsign = '';
  maxDepth = 140;

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private soundService: SoundService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.apiService.getProfile().subscribe({
        next: (p) => {
          if (p?.profile?.callsign) this.pilotCallsign = p.profile.callsign;
          else if (p?.username) this.pilotCallsign = p.username;
        }
      });
      // Retrieve best score from user's history
      const savedScore = localStorage.getItem('ocean_quest_best_score');
      if (savedScore) {
        this.bestScore = parseInt(savedScore, 10);
      }
    }

    // Check if this is the user's first visit
    const seenWelcome = localStorage.getItem('ocean_quest_has_seen_welcome');
    if (!seenWelcome) {
      // Auto-trigger welcome experience with gentle delay for smooth page entrance
      setTimeout(() => {
        this.isWelcomeModalOpen = true;
        this.soundService.playWelcomeFanfare();
      }, 450);
    }
  }

  dismissWelcome(): void {
    this.isWelcomeModalOpen = false;
    localStorage.setItem('ocean_quest_has_seen_welcome', 'true');
  }

  launchFirstDive(): void {
    this.dismissWelcome();
    this.startGame();
  }

  startGame(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/levels']);
    }
  }

  showHighestScore(): void {
    this.isHighScoreModalOpen = true;
  }

  closeHighScoreModal(): void {
    this.isHighScoreModalOpen = false;
  }

  goToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  openSettings(): void {
    this.isSettingsOpen = true;
  }

  closeSettings(): void {
    this.isSettingsOpen = false;
  }
}
