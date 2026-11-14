/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * WelcomeModalComponent — First-time pilot briefing modal & welcome screen.
 * Extracted from HomeComponent for separation of concerns (Low Coupling principle).
 * Emits (dive) to launch game, (dismiss) to close.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostListener
} from '@angular/core';

@Component({
  selector: 'app-welcome-modal',
  template: `
    <div
      class="wm-overlay"
      *ngIf="visible"
      (click)="onOverlayClick()"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome briefing"
    >
      <!-- Animated Cinematic Background Layer -->
      <div class="wm-backdrop-img-layer" style="background-image: url('assets/background/welcome_screen_background/welcome_screen_background.png');" aria-hidden="true">
        <div class="wm-backdrop-overlay"></div>
      </div>

      <!-- Ambient Floating Ocean Bubbles -->
      <div class="wm-ambient-bubbles" aria-hidden="true">
        <span class="wm-ambient-bubble" style="left:8%;  width:10px; height:10px; animation-duration:9s;   animation-delay:0s;"></span>
        <span class="wm-ambient-bubble" style="left:20%; width:6px;  height:6px;  animation-duration:7.5s; animation-delay:1.2s;"></span>
        <span class="wm-ambient-bubble" style="left:35%; width:14px; height:14px; animation-duration:11s;  animation-delay:0.5s;"></span>
        <span class="wm-ambient-bubble" style="left:52%; width:8px;  height:8px;  animation-duration:8s;   animation-delay:2.1s;"></span>
        <span class="wm-ambient-bubble" style="left:68%; width:12px; height:12px; animation-duration:10s;  animation-delay:0.8s;"></span>
        <span class="wm-ambient-bubble" style="left:82%; width:7px;  height:7px;  animation-duration:7s;   animation-delay:1.6s;"></span>
        <span class="wm-ambient-bubble" style="left:92%; width:11px; height:11px; animation-duration:9.5s; animation-delay:0.2s;"></span>
      </div>

      <div class="wm-card" (click)="$event.stopPropagation()">

        <!-- ══ Animated ocean header strip ══ -->
        <div class="wm-header" style="background-image: url('assets/background/welcome_screen_background/welcome_screen_background.png');" aria-hidden="true">
          <div class="wm-header-tint"></div>
          <!-- Bubbles inside header -->
          <span class="wm-hbubble" style="left:8%;  width:7px;  height:7px;  animation-duration:5.5s; animation-delay:0s;"></span>
          <span class="wm-hbubble" style="left:22%; width:5px;  height:5px;  animation-duration:7s;   animation-delay:1s;"></span>
          <span class="wm-hbubble" style="left:40%; width:9px;  height:9px;  animation-duration:6s;   animation-delay:0.4s;"></span>
          <span class="wm-hbubble" style="left:62%; width:6px;  height:6px;  animation-duration:8s;   animation-delay:2s;"></span>
          <span class="wm-hbubble" style="left:80%; width:8px;  height:8px;  animation-duration:5s;   animation-delay:0.8s;"></span>

          <!-- Wave SVG at bottom of header -->
          <svg class="wm-header-wave" viewBox="0 0 500 28" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,14 C60,0 120,28 180,14 C240,0 300,28 360,14 C410,3 460,22 500,14 L500,28 L0,28 Z"
                  fill="rgba(4, 20, 38, 0.85)"/>
          </svg>
        </div>

        <!-- ══ Logo ══ -->
        <div class="wm-logo-wrap">
          <img
            src="assets/logo/logo.png"
            alt="Ocean Quest Chronicles"
            class="wm-logo"
            onerror="this.style.display='none'"
          >
        </div>

        <!-- ══ Badge + Title ══ -->
        <div class="wm-badge">⚓ EXPEDITION DISPATCH</div>
        <h2 class="wm-title">WELCOME ABOARD!</h2>
        <p class="wm-subtitle">
          Greetings, <strong>{{ callsign || 'Deep Sea Explorer' }}</strong>!<br>
          Your underwater expedition begins now.
        </p>

        <!-- ══ Wave divider ══ -->
        <div class="wm-wave-row" aria-hidden="true">
          <svg viewBox="0 0 400 16" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,8 C50,0 100,16 150,8 C200,0 250,16 300,8 C350,0 385,14 400,8"
                  stroke="rgba(56,189,248,0.4)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- ══ 3-step briefing cards ══ -->
        <div class="wm-grid">
          <div class="wm-step wm-step-1">
            <div class="wm-step-icon">🫧</div>
            <div class="wm-step-title">1. Breathe</div>
            <div class="wm-step-desc">Collect oxygen bubbles before your danger meter fills.</div>
          </div>
          <div class="wm-step wm-step-2">
            <div class="wm-step-icon">🦈</div>
            <div class="wm-step-title">2. Evade</div>
            <div class="wm-step-desc">Dodge reef sharks, pirates and deep-sea guardians.</div>
          </div>
          <div class="wm-step wm-step-3">
            <div class="wm-step-icon">🧩</div>
            <div class="wm-step-title">3. Solve</div>
            <div class="wm-step-desc">Memorise fish patterns, then crack the sonar enigma!</div>
          </div>
        </div>

        <!-- ══ Action buttons ══ -->
        <div class="wm-actions">
          <button class="btn-pill btn-coral wm-btn-dive" (click)="onDive()">
            🤿 DIVE INTO THE DEEP
          </button>
          <button class="btn-pill btn-white wm-btn-dismiss" (click)="onDismiss()">
            EXPLORE HUB FIRST
          </button>
        </div>

        <!-- Close button -->
        <button class="wm-close-x" (click)="onDismiss()" aria-label="Close">✕</button>
      </div>
    </div>
  `,
  styles: [`
    /* ══ Overlay ══ */
    .wm-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(1, 10, 24, 0.75);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      animation: wmFadeIn 0.35s ease both;
      overflow: hidden;
    }
    @keyframes wmFadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ══ Animated Cinematic Background Layer ══ */
    .wm-backdrop-img-layer {
      position: absolute;
      inset: -5%;
      width: 110%;
      height: 110%;
      background-position: center center;
      background-size: cover;
      background-repeat: no-repeat;
      animation: wmBackdropDrift 20s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: 0;
      will-change: transform;
    }
    .wm-backdrop-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 50% at 50% 25%, rgba(14, 116, 144, 0.45) 0%, transparent 70%),
        linear-gradient(180deg, rgba(3, 14, 28, 0.7) 0%, rgba(1, 8, 16, 0.9) 100%);
    }
    @keyframes wmBackdropDrift {
      0%   { transform: scale(1) translate(0, 0); }
      50%  { transform: scale(1.05) translate(-1%, -0.8%); }
      100% { transform: scale(1.02) translate(0.8%, 0.5%); }
    }

    /* ══ Ambient Floating Bubbles ══ */
    .wm-ambient-bubbles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .wm-ambient-bubble {
      position: absolute;
      bottom: -30px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.75) 0%, rgba(56, 189, 248, 0.25) 50%, rgba(255, 255, 255, 0) 100%);
      border: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
      animation: wmAscend linear infinite;
    }
    @keyframes wmAscend {
      0%   { transform: translateY(0) scale(0.8); opacity: 0; }
      10%  { opacity: 0.8; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-115vh) scale(1.15); opacity: 0; }
    }

    /* ══ Frosted Glass Card ══ */
    .wm-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 500px;
      background: rgba(4, 20, 38, 0.72) !important;
      backdrop-filter: blur(24px) saturate(1.5) !important;
      -webkit-backdrop-filter: blur(24px) saturate(1.5) !important;
      border: 1.5px solid rgba(56, 189, 248, 0.45) !important;
      border-radius: 26px;
      overflow: hidden;
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.85),
        0 0 45px rgba(56, 189, 248, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      animation: wmCardPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both;
      text-align: center;
      padding-bottom: 2rem;
    }
    @keyframes wmCardPop {
      from { transform: scale(0.82) translateY(24px); opacity: 0; }
      to   { transform: scale(1)    translateY(0);    opacity: 1; }
    }

    /* ══ Animated ocean header ══ */
    .wm-header {
      position: relative;
      width: 100%;
      height: 95px;
      background-position: center top;
      background-size: cover;
      background-repeat: no-repeat;
      overflow: hidden;
      flex-shrink: 0;
    }
    .wm-header-tint {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(10, 74, 122, 0.8) 0%, rgba(6, 46, 85, 0.9) 60%, rgba(4, 31, 60, 0.98) 100%);
      pointer-events: none;
    }

    /* Bubbles inside header */
    .wm-hbubble {
      position: absolute;
      bottom: -16px;
      border-radius: 50%;
      background: radial-gradient(circle at 32% 28%,
        rgba(255,255,255,0.6) 0%,
        rgba(130,210,255,0.2) 50%,
        transparent 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      animation: wmBubbleRise linear infinite;
    }
    @keyframes wmBubbleRise {
      0%   { transform: translateY(0);       opacity: 0; }
      5%   { opacity: 0.9; }
      100% { transform: translateY(-110px);  opacity: 0; }
    }



    /* Wave cut at bottom of header */
    .wm-header-wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 24px;
      pointer-events: none;
    }

    /* ══ Logo ══ */
    .wm-logo-wrap {
      margin-top: -36px;
      position: relative;
      z-index: 2;
    }
    .wm-logo {
      width: 90px;
      height: auto;
      filter:
        drop-shadow(0 0 16px rgba(56,189,248,0.7))
        drop-shadow(0 4px 12px rgba(0,0,0,0.8));
      animation: wmLogoFloat 3s ease-in-out infinite alternate;
    }
    @keyframes wmLogoFloat {
      from { transform: translateY(0); }
      to   { transform: translateY(-5px); }
    }

    /* ══ Badge ══ */
    .wm-badge {
      display: inline-block;
      margin-top: 0.8rem;
      padding: 0.25rem 0.9rem;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #7dd3fc;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }

    /* ══ Title & subtitle ══ */
    .wm-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
      margin: 0.4rem 0 0.2rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6);
    }
    .wm-subtitle {
      font-size: 0.88rem;
      color: #94d8f8;
      line-height: 1.45;
      padding: 0 1.5rem;
      margin-bottom: 0.8rem;
    }
    .wm-subtitle strong { color: #ffffff; }

    /* ══ Wave row ══ */
    .wm-wave-row {
      width: 60%;
      margin: 0 auto 1.1rem;
      opacity: 0.6;
    }
    .wm-wave-row svg { width: 100%; height: 12px; }

    /* ══ 3-step briefing cards ══ */
    .wm-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
      padding: 0 1.2rem;
      margin-bottom: 1.5rem;
    }
    .wm-step {
      background: rgba(2, 14, 28, 0.65);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 14px;
      padding: 0.75rem 0.45rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .wm-step:hover {
      transform: translateY(-3px);
      border-color: rgba(56, 189, 248, 0.55);
    }
    .wm-step-1 { border-top: 2px solid #38bdf8; }
    .wm-step-2 { border-top: 2px solid #fb923c; }
    .wm-step-3 { border-top: 2px solid #a78bfa; }

    .wm-step-icon {
      font-size: 1.4rem;
      margin-bottom: 0.3rem;
    }
    .wm-step-title {
      font-size: 0.78rem;
      font-weight: 800;
      color: #e0f4ff;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .wm-step-desc {
      font-size: 0.68rem;
      color: #7ab8d8;
      line-height: 1.35;
    }

    /* ══ Action buttons ══ */
    .wm-actions {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding: 0 2rem;
    }
    .wm-btn-dive {
      width: 100%;
      padding: 0.85rem 1.4rem;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #ff6b4a 0%, #fa4d28 100%);
      box-shadow: 0 6px 20px rgba(250, 77, 40, 0.45);
      border: none;
      cursor: pointer;
      border-radius: 999px;
      color: #ffffff;
      transition: all 0.2s ease;
    }
    .wm-btn-dive:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(250, 77, 40, 0.65);
    }
    .wm-btn-dismiss {
      width: 100%;
      padding: 0.65rem 1.4rem;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #bae6fd;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.3);
      cursor: pointer;
      border-radius: 999px;
      transition: all 0.2s ease;
    }
    .wm-btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-color: rgba(56, 189, 248, 0.6);
      transform: translateY(-1px);
    }

    /* ══ Close button ══ */
    .wm-close-x {
      position: absolute;
      top: 12px;
      right: 14px;
      background: rgba(2, 14, 28, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 0.85rem;
      color: #bae6fd;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10;
    }
    .wm-close-x:hover {
      background: rgba(239, 68, 68, 0.35);
      border-color: #ef4444;
      color: #ffffff;
      transform: scale(1.1);
    }

    @media (max-width: 480px) {
      .wm-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      .wm-card {
        max-width: 95vw;
      }
    }
  `]
})
export class WelcomeModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() callsign = '';
  @Output() dive = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue) {
      document.body.style.overflow = 'hidden';
    } else if (changes['visible'] && !changes['visible'].currentValue) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible) {
      this.onDismiss();
    }
  }

  onOverlayClick(): void {
    this.onDismiss();
  }

  onDive(): void {
    document.body.style.overflow = '';
    this.dive.emit();
  }

  onDismiss(): void {
    document.body.style.overflow = '';
    this.dismiss.emit();
  }
}
