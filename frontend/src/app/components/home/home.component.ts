import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';
import { MarineService } from '../../services/marine.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-screen-container">
      <!-- Fullscreen Custom Home Background Image -->
      <div class="home-custom-bg" style="background-image: url('assets/background/game_home_background/home_background.png')" aria-hidden="true"></div>

      <!-- Rising Ambient Underwater Bubbles Animation Layer -->
      <div class="ambient-bubbles-layer home-bubbles-layer" aria-hidden="true">
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
        <div class="ambient-bubble"></div>
      </div>

      <!-- Top Profile Navigation Icon (as shown on Screen 1) -->
      <div class="home-top-nav">
        <a [routerLink]="authService.isLoggedIn() ? '/profile' : '/login'" class="profile-avatar-btn" title="Pilot Profile">
          <div class="avatar-circle">
            <img [src]="authService.getDiverAvatar(pilotCallsign)" alt="Pilot Avatar" class="avatar-face-img" (error)="authService.handleAvatarError($event)" />
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
          <button class="btn-pill btn-daily-explore" (click)="openDailyChallenge()">
            <span class="daily-btn-content">
              <span class="daily-btn-icon">📅</span>
              <span>Explore Daily Challenge</span>
            </span>
            <span class="daily-btn-chip" [class.chip-done]="dailyCompleted">
              {{ dailyCompleted ? 'COMPLETED ⭐' : '+500 XP' }}
            </span>
          </button>
          <button class="btn-pill btn-ice btn-settings" (click)="openWelcome()" style="margin-bottom: 0.45rem;">
            📋 Mission Briefing
          </button>
          <button class="btn-pill btn-ice btn-settings" (click)="openSettings()">
            ⚙️ Game Settings
          </button>
        </div>
      </main>

      <!-- Highest Score Modal Popup (Elevated Arcade Polish) -->
      <div class="highest-score-overlay" *ngIf="isHighScoreModalOpen" (click)="closeHighScoreModal()">
        <div class="ocean-glass-card personal-best-card" (click)="$event.stopPropagation()">
          
          <!-- Top-Right Close Button -->
          <button class="modal-close-icon-btn" (click)="closeHighScoreModal()" title="Close Dossier">✕</button>

          <!-- Top Badge & Header -->
          <div class="personal-best-header">
            <div class="dossier-pill-tag">
              <span class="pulsing-radar-dot"></span>
              <span>EXPEDITION DOSSIER</span>
            </div>
            <h2 class="personal-best-title">⭐ PERSONAL BEST</h2>
            <!-- Real-Time Environmental Telemetry from Open-Meteo Marine API -->
            <div class="marine-weather-pill" title="Live Open-Meteo Marine Telemetry">
              <span>🌊 {{ currentTelemetry.city }}: {{ currentTelemetry.waterTemperature }}°C | Swell: {{ currentTelemetry.waveHeight }}m</span>
            </div>
          </div>

          <!-- Hero Overall Record Display Banner -->
          <div class="hero-record-banner">
            <div class="hero-record-top">
              <span class="hero-trophy-icon">🏆</span>
              <span class="hero-record-label">OVERALL RECORD SCORE</span>
            </div>
            <div class="hero-record-score">
              <span class="hero-digits">{{ bestScore }}</span>
              <span class="hero-unit">PTS</span>
            </div>
          </div>

          <!-- Pilot Quick Stats Cards (2-column grid, compact & clean) -->
          <div class="pilot-quick-grid">
            <div class="quick-stat-card">
              <span class="stat-mini-label">PILOT CALL-SIGN</span>
              <div class="pilot-badge-flex">
                <img [src]="authService.getDiverAvatar(pilotCallsign)" alt="Avatar" class="mini-diver-avatar" width="24" height="24" (error)="authService.handleAvatarError($event)" />
                <span class="stat-mini-value pilot-name">{{ pilotCallsign || 'Naval Diver' }}</span>
              </div>
            </div>
            <div class="quick-stat-card">
              <span class="stat-mini-label">MAX DEPTH REACHED</span>
              <span class="stat-mini-value depth-val">🌊 {{ maxDepth }}m</span>
            </div>
          </div>

          <!-- Sector High Score Cards (All 3 Levels Visible with Distinctive Aesthetic) -->
          <div class="sector-scores-section">
            <div class="sector-scores-header">
              <span class="section-badge">SECTOR RECORDS</span>
              <span class="section-sub">DEEP SEA HIGH SCORES</span>
            </div>

            <!-- Level 1 Card: Shark Waters (Cyan Theme) -->
            <div class="sector-card lvl1-card">
              <div class="sector-left">
                <div class="sector-avatar-badge lvl1-badge">🦈</div>
                <div class="sector-text">
                  <div class="sector-title-row">
                    <span class="sector-name">Level 1: Shark Waters</span>
                    <span class="sector-tag tag-easy">EASY</span>
                  </div>
                  <span class="sector-desc">Surface Reef (Depth &lt; 140m)</span>
                </div>
              </div>
              <div class="sector-score-pill lvl1-score">
                <span class="score-num">{{ level1Best }}</span>
                <span class="score-pts">PTS</span>
              </div>
            </div>

            <!-- Level 2 Card: Pirate Cove (Gold Theme) -->
            <div class="sector-card lvl2-card">
              <div class="sector-left">
                <div class="sector-avatar-badge lvl2-badge">🏴‍☠️</div>
                <div class="sector-text">
                  <div class="sector-title-row">
                    <span class="sector-name">Level 2: Pirate Cove</span>
                    <span class="sector-tag tag-med">MEDIUM</span>
                  </div>
                  <span class="sector-desc">Sunken Galleon (140–279m)</span>
                </div>
              </div>
              <div class="sector-score-pill lvl2-score">
                <span class="score-num">{{ level2Best }}</span>
                <span class="score-pts">PTS</span>
              </div>
            </div>

            <!-- Level 3 Card: Abyss Trench (Purple/Bio Theme) -->
            <div class="sector-card lvl3-card">
              <div class="sector-left">
                <div class="sector-avatar-badge lvl3-badge">🐙</div>
                <div class="sector-text">
                  <div class="sector-title-row">
                    <span class="sector-name">Level 3: Abyss Trench</span>
                    <span class="sector-tag tag-hard">HARD</span>
                  </div>
                  <span class="sector-desc">Midnight Trench (Depth ≥ 280m)</span>
                </div>
              </div>
              <div class="sector-score-pill lvl3-score">
                <span class="score-num">{{ level3Best }}</span>
                <span class="score-pts">PTS</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="modal-actions-row">
            <button class="btn-pill btn-coral btn-modal-action" (click)="startGame()">
              DIVE IN NOW 🤿
            </button>
            <button class="btn-pill btn-white btn-modal-action" (click)="closeHighScoreModal()">
              CLOSE
            </button>
          </div>
        </div>
      </div>

      <!-- First-Time Pilot Welcome & Briefing Modal (Decoupled Component) -->
      <app-welcome-modal
        [visible]="isWelcomeModalOpen"
        [callsign]="pilotCallsign"
        (dive)="launchFirstDive()"
        (dismiss)="dismissWelcome()"
      ></app-welcome-modal>

      
      <!-- Daily Sonar Cipher Modal Dialog (Theme 3: Fish Game API & Theme 4: Virtual Identity) -->
      <div class="daily-modal-backdrop" *ngIf="isDailyModalOpen" (click)="closeDailyChallenge()">
        <div class="ocean-glass-card daily-puzzle-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-icon-btn" (click)="closeDailyChallenge()" title="Close">✕</button>

          <div class="daily-modal-header">
            <div class="dossier-pill-tag">
              <span class="pulsing-radar-dot"></span>
              <span>UoB FISH GAME API • DAILY CIPHER</span>
            </div>
            <h2 class="daily-modal-title">DAILY SONAR EXPEDITION</h2>
            <p class="daily-modal-sub">
              📍 Station: {{ currentTelemetry.city }} ({{ currentTelemetry.waterTemperature }}°C) • Scan Date: {{ todayDateStr }}
            </p>
          </div>

          <!-- Already Completed State -->
          <div *ngIf="dailyCompleted" class="daily-completed-view">
            <div class="daily-complete-trophy">🌟</div>
            <h3 class="daily-complete-title">EXPEDITION CIPHER CLEARED!</h3>
            <p class="daily-complete-desc">You successfully decoded today's naval fish challenge and earned +500 Bonus XP!</p>
            <div class="daily-countdown-note">
              <span>Next satellite optical scan arrives tomorrow at 00:00 UTC.</span>
            </div>
            <button type="button" class="btn-pill btn-coral" (click)="closeDailyChallenge()" style="margin-top: 1.2rem;">
              Back to Main Menu
            </button>
          </div>

          <!-- Active Challenge View -->
          <div *ngIf="!dailyCompleted" class="daily-active-view">
            <!-- Loading -->
            <div *ngIf="dailyLoading" class="daily-loading-box">
              <div class="sonar-spinner"></div>
              <span>Connecting to UoB Fish Game API optical stream...</span>
            </div>

            <!-- Puzzle Image Container -->
            <div *ngIf="!dailyLoading && dailyPuzzle" class="daily-image-frame">
              <img [src]="dailyPuzzle.question" alt="Daily Fish Challenge" class="daily-puzzle-img" />
              <div class="scan-grid-overlay"></div>
            </div>

            <p class="daily-prompt-instruction" *ngIf="!dailyLoading && dailyPuzzle">
              👁️ Count the number of fish on the sonar display and select the matching count:
            </p>

            <!-- 3 Options Buttons -->
            <div *ngIf="!dailyLoading && dailyPuzzle && !dailySuccess && dailyCooldownSeconds <= 0" class="daily-options-grid">
              <button 
                type="button" 
                *ngFor="let opt of dailyOptions" 
                class="daily-choice-pill" 
                (click)="submitDailyAnswer(opt)" 
                [disabled]="dailySubmitting"
              >
                <span class="opt-num">{{ opt }}</span>
                <span class="opt-sub">FISH</span>
              </button>
            </div>

            <!-- Cooldown State -->
            <div *ngIf="dailyCooldownSeconds > 0" class="daily-cooldown-box">
              <span class="cooldown-icon">⏳</span>
              <span>Sonar sensor recalibration in progress... Retry in <strong>{{ dailyCooldownSeconds }}s</strong></span>
            </div>

            <!-- Feedback Message -->
            <p *ngIf="dailyMessage" class="daily-feedback-pill" [class.success]="dailySuccess" [class.error]="!dailySuccess">
              {{ dailyMessage }}
            </p>
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
      overflow: hidden;
    }

    .home-custom-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-repeat: no-repeat;
      background-position: center center;
      background-size: cover;
      z-index: 0;
      pointer-events: none;
    }

    .home-bubbles-layer {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
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
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }

    .logo-hero-container {
      margin-bottom: 1.2rem;
    }

    .home-hero-logo {
      width: 220px;
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
      gap: 0.65rem;
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
      font-size: 1rem;
      padding: 0.75rem 1.8rem;
    }

    .btn-settings {
      margin-top: 0.3rem;
      font-size: 0.95rem;
      padding: 0.65rem 1.5rem;
    }


    .personal-best-card {
      position: relative;
      max-width: 480px;
      width: 100%;
      background: rgba(4, 20, 38, 0.65) !important;
      backdrop-filter: blur(24px) saturate(1.6) !important;
      -webkit-backdrop-filter: blur(24px) saturate(1.6) !important;
      backdrop-filter: blur(24px) saturate(1.6);
      -webkit-backdrop-filter: blur(24px) saturate(1.6);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 28px;
      padding: 1.6rem 1.6rem 1.4rem 1.6rem;
      box-shadow: 0 25px 65px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25);
      animation: scaleUpAnim 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      overflow: hidden;
    }

    .modal-close-icon-btn {
      position: absolute;
      top: 1.1rem;
      right: 1.2rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #94a3b8;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .modal-close-icon-btn:hover {
      background: rgba(255, 75, 75, 0.25);
      border-color: #ff5238;
      color: #ffffff;
      transform: scale(1.1);
    }

    .personal-best-header {
      text-align: center;
      margin-bottom: 0.9rem;
    }

    .avatar-face-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .marine-weather-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      padding: 0.2rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.68rem;
      font-weight: 700;
      color: #7dd3fc;
      margin-top: 0.35rem;
      letter-spacing: 0.4px;
    }

    .pilot-badge-flex {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      width: 100%;
    }

    .mini-diver-avatar {
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      border-radius: 50% !important;
      border: 1.5px solid #38bdf8 !important;
      background: #021327 !important;
      flex-shrink: 0 !important;
      object-fit: cover !important;
      display: inline-block !important;
    }

    .dossier-pill-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.45);
      padding: 0.25rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 1.4px;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }

    .pulsing-radar-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: dotPulse 1.2s infinite alternate;
    }

    @keyframes dotPulse {
      from { opacity: 0.4; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1.2); }
    }

    .personal-best-title {
      font-size: 1.55rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1px;
      margin: 0;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 190, 59, 0.3);
    }

    /* Hero Record Score Banner */
    .hero-record-banner {
      position: relative;
      background: linear-gradient(135deg, rgba(255, 123, 84, 0.28) 0%, rgba(255, 82, 56, 0.42) 60%, rgba(255, 190, 59, 0.28) 100%);
      border: 1.5px solid rgba(255, 123, 84, 0.7);
      border-radius: 20px;
      padding: 0.8rem 1.2rem;
      text-align: center;
      margin-bottom: 0.9rem;
      box-shadow: 0 8px 24px rgba(255, 82, 56, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      overflow: hidden;
    }

    .hero-record-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-bottom: 0.15rem;
    }

    .hero-trophy-icon {
      font-size: 1.15rem;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    }

    .hero-record-label {
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: #ffe4d6;
      text-transform: uppercase;
    }

    .hero-record-score {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.35rem;
    }

    .hero-digits {
      font-size: 2.25rem;
      font-weight: 900;
      color: #ffffff;
      line-height: 1;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 190, 59, 0.5);
    }

    .hero-unit {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffbe3b;
      letter-spacing: 1px;
    }

    /* Pilot Quick Stats (2-column grid) */
    .pilot-quick-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-bottom: 0.9rem;
    }

    .quick-stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 0.55rem 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }

    .stat-mini-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .stat-mini-value {
      font-size: 0.92rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .stat-mini-value.pilot-name {
      color: #38bdf8;
    }

    .stat-mini-value.depth-val {
      color: #67e8f9;
    }

    /* Sector Scores Section */
    .sector-scores-section {
      background: rgba(2, 14, 28, 0.65);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 18px;
      padding: 0.8rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .sector-scores-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.2rem 0.15rem 0.2rem;
    }

    .section-badge {
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: #38bdf8;
      text-transform: uppercase;
    }

    .section-sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.4px;
    }

    /* Individual Sector Cards */
    .sector-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.7rem;
      border-radius: 14px;
      transition: all 0.2s ease;
    }

    .sector-card:hover {
      transform: translateX(2px);
    }

    .sector-card.lvl1-card {
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-left: 3.5px solid #38bdf8;
    }

    .sector-card.lvl2-card {
      background: linear-gradient(90deg, rgba(251, 191, 36, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-left: 3.5px solid #fbbf24;
    }

    .sector-card.lvl3-card {
      background: linear-gradient(90deg, rgba(192, 132, 252, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-left: 3.5px solid #c084fc;
    }

    .sector-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-align: left;
    }

    .sector-avatar-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .lvl1-badge {
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid rgba(56, 189, 248, 0.5);
    }

    .lvl2-badge {
      background: rgba(251, 191, 36, 0.2);
      border: 1px solid rgba(251, 191, 36, 0.5);
    }

    .lvl3-badge {
      background: rgba(192, 132, 252, 0.2);
      border: 1px solid rgba(192, 132, 252, 0.5);
    }

    .sector-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .sector-title-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .sector-name {
      font-size: 0.86rem;
      font-weight: 800;
      color: #ffffff;
    }

    .sector-tag {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      letter-spacing: 0.6px;
    }

    .tag-easy {
      background: rgba(56, 189, 248, 0.25);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.5);
    }

    .tag-med {
      background: rgba(251, 191, 36, 0.25);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.5);
    }

    .tag-hard {
      background: rgba(192, 132, 252, 0.25);
      color: #c084fc;
      border: 1px solid rgba(192, 132, 252, 0.5);
    }

    .sector-desc {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    /* Sector Score Pill */
    .sector-score-pill {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      font-weight: 900;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      flex-shrink: 0;
    }

    .lvl1-score {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%);
      border: 1px solid rgba(56, 189, 248, 0.5);
      color: #38bdf8;
    }

    .lvl2-score {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.3) 100%);
      border: 1px solid rgba(251, 191, 36, 0.5);
      color: #fbbf24;
    }

    .lvl3-score {
      background: linear-gradient(135deg, rgba(192, 132, 252, 0.2) 0%, rgba(168, 85, 247, 0.3) 100%);
      border: 1px solid rgba(192, 132, 252, 0.5);
      color: #c084fc;
    }

    .score-num {
      font-size: 1.05rem;
      line-height: 1;
    }

    .score-pts {
      font-size: 0.72rem;
      opacity: 0.85;
    }

    /* Modal Action Buttons */
    .modal-actions-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.8rem;
      width: 100%;
    }

    .btn-modal-action {
      width: 100%;
      font-size: 1rem;
      padding: 0.85rem 1.2rem;
      letter-spacing: 0.5px;
    }

    .highest-score-overlay,
    .welcome-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(2, 12, 26, 0.55);
      backdrop-filter: blur(16px) saturate(1.3);
      -webkit-backdrop-filter: blur(16px) saturate(1.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.2rem;
      animation: fadeInOverlay 0.3s ease;
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
    
    /* Explore Daily Challenge Menu Button */
    .btn-daily-explore {
      width: 100%;
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.9), rgba(3, 105, 161, 0.9));
      border: 1.5px solid #38bdf8;
      color: #ffffff;
      font-size: 1.05rem;
      padding: 0.85rem 1.4rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 16px rgba(56, 189, 248, 0.3);
      cursor: pointer;
      transition: all 0.25s ease;
      animation: slideUpFade 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      animation-delay: 0.22s;
    }
    .btn-daily-explore:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45), 0 0 24px rgba(56, 189, 248, 0.5);
      border-color: #7dd3fc;
    }
    .daily-btn-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .daily-btn-icon {
      font-size: 1.25rem;
    }
    .daily-btn-chip {
      background: rgba(254, 240, 138, 0.25);
      border: 1px solid rgba(254, 240, 138, 0.6);
      color: #fef08a;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }
    .daily-btn-chip.chip-done {
      background: rgba(34, 197, 94, 0.3);
      border-color: rgba(34, 197, 94, 0.7);
      color: #86efac;
    }


    /* Daily Sonar Cipher Modal */
    .daily-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(3, 10, 20, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.3s ease;
    }
    .daily-puzzle-card {
      width: 100%;
      max-width: 520px;
      position: relative;
      background: rgba(3, 20, 36, 0.92);
      border: 1.5px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.25);
      border-radius: 24px;
      padding: 1.8rem;
      text-align: center;
    }
    .daily-modal-header {
      margin-bottom: 1.2rem;
    }
    .daily-modal-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0.3rem 0;
      letter-spacing: 0.04em;
    }
    .daily-modal-sub {
      font-size: 0.82rem;
      color: #94a3b8;
    }
    .daily-loading-box {
      padding: 2.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: #bae6fd;
      font-size: 0.9rem;
    }
    .daily-image-frame {
      position: relative;
      width: 100%;
      max-height: 250px;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(56, 189, 248, 0.6);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2);
      margin-bottom: 1rem;
      background: #021220;
    }
    .daily-puzzle-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .daily-prompt-instruction {
      font-size: 0.88rem;
      color: #e0f2fe;
      font-weight: 700;
      margin-bottom: 1.1rem;
    }
    .daily-options-grid {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .daily-choice-pill {
      flex: 1;
      max-width: 110px;
      padding: 0.75rem 0.5rem;
      border-radius: 16px;
      background: rgba(3, 30, 55, 0.85);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      color: #ffffff;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }
    .daily-choice-pill:hover:not(:disabled) {
      transform: translateY(-3px);
      background: rgba(14, 165, 233, 0.35);
      border-color: #38bdf8;
      box-shadow: 0 8px 20px rgba(56, 189, 248, 0.4);
    }
    .opt-num {
      font-size: 1.6rem;
      font-weight: 800;
      color: #38bdf8;
    }
    .opt-sub {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #94a3b8;
    }
    .daily-feedback-pill {
      font-size: 0.88rem;
      font-weight: 700;
      padding: 0.6rem 1rem;
      border-radius: 9999px;
      margin-top: 0.6rem;
    }
    .daily-feedback-pill.success {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid #22c55e;
      color: #86efac;
    }
    .daily-feedback-pill.error {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #fca5a5;
    }
    .daily-cooldown-box {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(234, 179, 8, 0.15);
      border: 1px solid rgba(234, 179, 8, 0.4);
      color: #fef08a;
      font-size: 0.84rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
    }
    .daily-completed-view {
      padding: 1.5rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .daily-complete-trophy {
      font-size: 3.5rem;
      margin-bottom: 0.5rem;
      animation: floatLogo 3s ease-in-out infinite alternate;
    }
    .daily-complete-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #4ade80;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }
    .daily-complete-desc {
      font-size: 0.9rem;
      color: #c2e8fa;
      max-width: 380px;
      line-height: 1.4;
      margin-bottom: 1rem;
    }
    .daily-countdown-note {
      font-size: 0.78rem;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
    }

  `
]})
export class HomeComponent implements OnInit {
  isDailyModalOpen = false;
  dailyPuzzle: any = null;
  dailyLoading = false;
  dailySubmitting = false;
  dailyMessage = '';
  dailySuccess = false;
  dailyCooldownSeconds = 0;
  cooldownInterval: any = null;
  dailyOptions: number[] = [];

  get todayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get dailyKey(): string {
    const user = this.authService.getCurrentUser();
    const id = user?.id || user?.username || this.pilotCallsign || 'pilot';
    return `oq_daily_done_${id}_${this.todayDateStr}`;
  }

  get dailyCompleted(): boolean {
    if (this.serverDailyDone) return true;
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.dailyKey) === 'true';
  }
  serverDailyDone = false;
  isSettingsOpen = false;
  isHighScoreModalOpen = false;
  isWelcomeModalOpen = false;
  bestScore = 0;
  level1Best = 0;
  level2Best = 0;
  level3Best = 0;
  pilotCallsign = '';
  maxDepth = 0;
  highestSector = 'Level 1 (Shark Waters)';

  constructor(
    public authService: AuthService,
    public marineService: MarineService,
    private apiService: ApiService,
    private soundService: SoundService,
    private router: Router
  ) {}

  get currentTelemetry() {
    return this.marineService.currentTelemetry;
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.pilotCallsign = user.callsign || user.username || 'Naval Diver';
    }

    if (this.authService.isLoggedIn()) {
      const savedScore = localStorage.getItem('ocean_quest_best_score');
      if (savedScore) {
        this.bestScore = parseInt(savedScore, 10);
      }
      const savedL1 = localStorage.getItem('ocean_quest_level1_best');
      if (savedL1) this.level1Best = parseInt(savedL1, 10);
      const savedL2 = localStorage.getItem('ocean_quest_level2_best');
      if (savedL2) this.level2Best = parseInt(savedL2, 10);
      const savedL3 = localStorage.getItem('ocean_quest_level3_best');
      if (savedL3) this.level3Best = parseInt(savedL3, 10);
      const savedDepth = localStorage.getItem('ocean_quest_max_depth');
      if (savedDepth) {
        this.maxDepth = parseInt(savedDepth, 10);
      }
      const savedLvl = localStorage.getItem('ocean_quest_highest_level_cleared');
      if (savedLvl) {
        this.updateHighestSector(parseInt(savedLvl, 10));
      }

      this.apiService.getProfile().subscribe({
        next: (p) => {
          if (p?.profile?.callsign) this.pilotCallsign = p.profile.callsign;
          else if (p?.callsign) this.pilotCallsign = p.callsign;
          else if (p?.username) this.pilotCallsign = p.username;

          if (p?.dailyChallengeCompleted !== undefined) {
          this.serverDailyDone = !!p.dailyChallengeCompleted;
        }
        if (p?.bestScore !== undefined) {
            this.bestScore = p.bestScore || 0;
            localStorage.setItem('ocean_quest_best_score', String(this.bestScore));
          }
          if (p?.level1Best !== undefined) {
            this.level1Best = p.level1Best || 0;
            localStorage.setItem('ocean_quest_level1_best', String(this.level1Best));
          }
          if (p?.level2Best !== undefined) {
            this.level2Best = p.level2Best || 0;
            localStorage.setItem('ocean_quest_level2_best', String(this.level2Best));
          }
          if (p?.level3Best !== undefined) {
            this.level3Best = p.level3Best || 0;
            localStorage.setItem('ocean_quest_level3_best', String(this.level3Best));
          }
          if (p?.maxDepth !== undefined) {
            this.maxDepth = p.maxDepth || 0;
            localStorage.setItem('ocean_quest_max_depth', String(this.maxDepth));
          }
          if (p?.highestLevel !== undefined) {
            this.updateHighestSector(p.highestLevel || 0);
            localStorage.setItem('ocean_quest_highest_level_cleared', String(p.highestLevel || 0));
          }
        }
      });
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

  openWelcome(): void {
    this.isWelcomeModalOpen = true;
    this.soundService.playWelcomeFanfare();
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


  openDailyChallenge(): void {
    this.isDailyModalOpen = true;
    this.dailyMessage = '';
    this.dailySuccess = false;
    if (this.dailyCompleted) {
      return;
    }
    this.loadDailyPuzzle();
  }

  closeDailyChallenge(): void {
    this.isDailyModalOpen = false;
  }

  loadDailyPuzzle(): void {
    if (this.dailyCooldownSeconds > 0) return;
    this.dailyLoading = true;
    this.dailyMessage = '';
    this.dailyPuzzle = null;
    this.dailyOptions = [];

    this.apiService.newPuzzle().subscribe({
      next: (pz) => {
        this.dailyLoading = false;
        this.dailyPuzzle = pz;
        if (pz.options && pz.options.length) {
          this.dailyOptions = pz.options;
        } else {
          this.dailyOptions = [3, 5, 7];
        }
      },
      error: () => {
        this.dailyLoading = false;
        this.dailyMessage = 'Failed to connect to UoB Fish Game API. Please try again.';
      }
    });
  }

  submitDailyAnswer(answer: number): void {
    if (!this.dailyPuzzle || this.dailySubmitting || this.dailyCooldownSeconds > 0) return;
    this.dailySubmitting = true;
    this.dailyMessage = '';

    this.apiService.answerPuzzle(this.dailyPuzzle.puzzleId, answer).subscribe({
      next: (res) => {
        this.dailySubmitting = false;
        if (res.correct) {
          this.dailySuccess = true;
          this.dailyMessage = `Correct! Decrypted ${res.solution} fish! ⭐ +500 XP added to Lifetime Career Leaderboard!`;
          localStorage.setItem(this.dailyKey, 'true');
          this.serverDailyDone = true;
          this.apiService.recordDailyChallenge(this.todayDateStr).subscribe({
            next: () => console.log('Daily challenge XP synced with naval fleet.'),
            error: () => console.warn('Daily challenge local only.')
          });
          this.soundService.playChestUnlock();
          try {
            const user = this.authService.getCurrentUser();
            const achKey = 'oq_achievements_' + (user?.id || user?.username || 'pilot');
            const saved = JSON.parse(localStorage.getItem(achKey) || '{}');
            saved['cipher_master'] = new Date().toISOString();
            localStorage.setItem(achKey, JSON.stringify(saved));
          } catch {}
        } else {
          this.dailySuccess = false;
          this.dailyMessage = `❌ Incorrect! The scan showed ${res.solution} fish. Recalibrating sensors...`;
          this.startDailyCooldown(30);
        }
      },
      error: () => {
        this.dailySubmitting = false;
        this.dailyMessage = 'Error validating sonar cipher with server.';
      }
    });
  }

  startDailyCooldown(seconds: number): void {
    this.dailyCooldownSeconds = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.dailyCooldownSeconds--;
      if (this.dailyCooldownSeconds <= 0) {
        clearInterval(this.cooldownInterval);
        this.loadDailyPuzzle();
      }
    }, 1000);
  }
  private updateHighestSector(lvl: number): void {
    if (lvl >= 3) this.highestSector = 'Level 3 (Abyss Trench - Mastered)';
    else if (lvl === 2) this.highestSector = 'Level 3 (Abyss Trench)';
    else if (lvl === 1) this.highestSector = 'Level 2 (Pirate Cove)';
    else this.highestSector = 'Level 1 (Shark Waters)';
  }
}

