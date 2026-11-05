/**
 * Ocean Quest Chronicles Project (see docs/references.md).
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SoundService } from './services/sound.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <!-- Rising Ambient Underwater Bubbles Animation Layer -->
      <div class="ambient-bubbles-layer" aria-hidden="true">
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

      <!-- Main Router Outlet Area (Full Ocean Viewport) -->
      <main class="page-viewport">
        <router-outlet></router-outlet>
      </main>

      <!-- Quick Audio Toggle Control Pill (Floating in bottom left) -->
      <button 
        class="ambient-audio-toggle" 
        (click)="soundService.toggleMute()" 
        [title]="soundService.isMuted ? 'Unmute Ocean Audio' : 'Mute Ocean Audio'"
      >
        <span>{{ soundService.isMuted ? '🔇' : '🎵' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .ocean-navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 2.2rem;
      background: rgba(8, 54, 90, 0.52);
      backdrop-filter: blur(20px) saturate(1.5);
      -webkit-backdrop-filter: blur(20px) saturate(1.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 4px 24px rgba(2, 14, 32, 0.35), 0 1px 0 rgba(255, 255, 255, 0.12) inset;
      z-index: 50;
      position: sticky;
      top: 0;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #ffffff;
      font-weight: 800;
      font-size: 1.28rem;
      letter-spacing: 0.5px;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .navbar-brand:hover {
      transform: scale(1.04) translateY(-1px);
    }

    .nav-logo-thumb {
      height: 40px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 10px rgba(56, 189, 248, 0.25));
      transition: filter 0.3s ease;
    }

    .navbar-brand:hover .nav-logo-thumb {
      filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.5));
    }

    .brand-title {
      font-family: var(--font-family);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 14px rgba(56, 189, 248, 0.2);
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-chip {
      color: #c2e8fa;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.92rem;
      padding: 0.45rem 1.15rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.14);
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    .nav-chip::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0);
      transition: background 0.2s ease;
    }

    .nav-chip:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    }

    .nav-chip.active {
      background: linear-gradient(145deg, #ff8c69, #ff5238);
      color: #ffffff;
      border-color: rgba(255, 140, 100, 0.4);
      box-shadow: 0 4px 14px rgba(255, 82, 56, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .nav-profile-action {
      display: flex;
      align-items: center;
    }

    .nav-avatar-circle {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(145deg, #ffffff, #e0f4ff);
      border: 2.5px solid #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(56, 189, 248, 0.5);
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-avatar-circle:hover {
      transform: scale(1.14) translateY(-1px);
      border-color: #ff7b54;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 0 4px rgba(255, 123, 84, 0.3);
    }

    .page-viewport {
      flex: 1;
      position: relative;
      z-index: 10;
    }

    /* Floating Ambient Audio Toggle Pill */
    .ambient-audio-toggle {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(3, 20, 36, 0.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.5px solid rgba(56, 189, 248, 0.55);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 10px rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      color: #38bdf8;
      cursor: pointer;
      z-index: 99;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .ambient-audio-toggle:hover {
      transform: scale(1.14) translateY(-2px);
      background: rgba(14, 82, 119, 0.95);
      border-color: #38bdf8;
      box-shadow: 0 6px 22px rgba(56, 189, 248, 0.45);
      color: #ffffff;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(
    public authService: AuthService,
    public soundService: SoundService
  ) {}

  ngOnInit(): void {
    // Automatically trigger ambient ocean sound
    this.soundService.startBgm();
  }
}
