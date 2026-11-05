import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-settings-modal',
  template: `
    <div class="settings-backdrop" (click)="onBackdropClick($event)">
      <div class="ocean-glass-card settings-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <h2 class="card-title">
          <span class="icon">⚙</span> GAME SETTINGS
        </h2>

        <div class="settings-body">
          <!-- Master Volume -->
          <div class="setting-row">
            <span class="setting-label">MASTER VOLUME</span>
            <div class="slider-group">
              <input 
                type="range" 
                min="0" 
                max="100" 
                [(ngModel)]="masterVolume" 
                (change)="applyAudioSettings()" 
                class="ocean-slider"
              />
              <span class="setting-value">{{ masterVolume }}%</span>
            </div>
          </div>

          <!-- Music / SFX -->
          <div class="setting-row">
            <span class="setting-label">MUSIC / SFX</span>
            <div class="slider-group">
              <input 
                type="range" 
                min="0" 
                max="100" 
                [(ngModel)]="musicVolume" 
                (change)="applyAudioSettings()" 
                class="ocean-slider"
              />
              <span class="setting-value">{{ musicVolume }}%</span>
            </div>
          </div>

          <!-- Graphics Selector -->
          <div class="setting-row">
            <span class="setting-label">GRAPHICS</span>
            <div class="graphics-segmented-control">
              <button 
                type="button"
                class="segment-pill" 
                [class.active]="graphicsQuality === 'low'" 
                (click)="setGraphics('low')"
              >LOW</button>
              <button 
                type="button"
                class="segment-pill" 
                [class.active]="graphicsQuality === 'medium'" 
                (click)="setGraphics('medium')"
              >MEDIUM</button>
              <button 
                type="button"
                class="segment-pill" 
                [class.active]="graphicsQuality === 'high'" 
                (click)="setGraphics('high')"
              >HIGH</button>
            </div>
          </div>

          <!-- Fullscreen Toggle -->
          <div class="setting-row">
            <span class="setting-label">FULLSCREEN</span>
            <button 
              type="button" 
              class="fullscreen-toggle-btn" 
              [class.active]="isFullscreen"
              (click)="toggleFullscreen()"
            >
              <span class="toggle-indicator"></span>
              {{ isFullscreen ? 'ON' : 'OFF' }}
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Action Buttons -->
        <div class="btn-row">
          <button class="btn-pill btn-coral" (click)="saveAndResume()">
            SAVE & RESUME
          </button>
          <button class="btn-pill btn-white" (click)="goToMainMenu()">
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(3, 19, 36, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .settings-card {
      max-width: 480px;
      width: 100%;
      text-align: left;
    }

    .card-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      margin-bottom: 1.8rem;
    }

    .card-title .icon {
      font-size: 1.4rem;
    }

    .settings-body {
      display: flex;
      flex-direction: column;
      gap: 1.4rem;
      margin-bottom: 1.8rem;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .setting-label {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #ffffff;
      min-width: 130px;
    }

    .slider-group {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .ocean-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 8px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.35);
      outline: none;
      transition: background 0.2s;
    }

    .ocean-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ff7b54;
      border: 2px solid #ffffff;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      transition: transform 0.15s ease;
    }

    .ocean-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .setting-value {
      font-size: 0.95rem;
      font-weight: 700;
      min-width: 45px;
      text-align: right;
      color: #ffffff;
    }

    .graphics-segmented-control {
      display: flex;
      background: rgba(3, 25, 43, 0.5);
      border-radius: 9999px;
      padding: 3px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .segment-pill {
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .segment-pill.active {
      background: #ff7b54;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(255, 123, 84, 0.4);
    }

    .fullscreen-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 0.45rem 1.2rem;
      border-radius: 9999px;
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .fullscreen-toggle-btn.active {
      background: #ff7b54;
      border-color: #ff7b54;
      box-shadow: 0 2px 10px rgba(255, 123, 84, 0.4);
    }

    .toggle-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ffffff;
    }

    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 1.5rem 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SettingsModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  masterVolume = 50;
  musicVolume = 70;
  graphicsQuality: 'low' | 'medium' | 'high' = 'medium';
  isFullscreen = false;

  constructor(
    private router: Router,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    // Restore saved preferences
    const savedMaster = localStorage.getItem('oq_master_vol');
    if (savedMaster) this.masterVolume = parseInt(savedMaster, 10);

    const savedMusic = localStorage.getItem('oq_music_vol');
    if (savedMusic) this.musicVolume = parseInt(savedMusic, 10);

    const savedGfx = localStorage.getItem('oq_graphics');
    if (savedGfx === 'low' || savedGfx === 'medium' || savedGfx === 'high') {
      this.graphicsQuality = savedGfx;
    }

    this.isFullscreen = !!document.fullscreenElement;
  }

  setGraphics(q: 'low' | 'medium' | 'high'): void {
    this.graphicsQuality = q;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch(() => {
        this.isFullscreen = false;
      });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch(() => {
        this.isFullscreen = false;
      });
    }
  }

  applyAudioSettings(): void {
    localStorage.setItem('oq_master_vol', String(this.masterVolume));
    localStorage.setItem('oq_music_vol', String(this.musicVolume));
    if (this.masterVolume === 0 && !this.soundService.isMuted) {
      this.soundService.toggleMute();
    } else if (this.masterVolume > 0 && this.soundService.isMuted) {
      this.soundService.toggleMute();
    }
  }

  saveAndResume(): void {
    this.applyAudioSettings();
    localStorage.setItem('oq_graphics', this.graphicsQuality);
    this.close.emit();
  }

  goToMainMenu(): void {
    this.saveAndResume();
    this.router.navigate(['/']);
  }

  onBackdropClick(event: MouseEvent): void {
    this.close.emit();
  }
}
