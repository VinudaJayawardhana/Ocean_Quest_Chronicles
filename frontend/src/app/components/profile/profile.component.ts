import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="ocean-screen-layout">
      <div class="ocean-glass-card wide">
        <!-- Header -->
        <h2 class="card-title">
          <span class="dossier-icon">🤿</span> PILOT PROFILE DOSSIER
        </h2>
        <p class="card-subtitle">Official credentials and telemetry history recorded by naval command</p>

        <div *ngIf="loading" class="status-box">
          <div class="sonar-spinner"></div>
          Retrieving naval dossier...
        </div>

        <div *ngIf="!loading && profile" class="dossier-content">
          <!-- Diver Avatar Hero Portrait (DiceBear Avatar Virtual Identity) -->
          <div class="profile-hero-portrait-wrap">
            <div class="hero-avatar-ring">
              <img [src]="authService.getDiverAvatar(profile?.username)" alt="Diver Avatar" class="profile-hero-avatar-img" (error)="authService.handleAvatarError($event)" />
            </div>
            <div class="hero-callsign-info">
              <span class="hero-id-tag">OPERATIVE DOSSIER</span>
              <h3 class="hero-callsign-title">{{ profile?.profile?.callsign || profile?.callsign || profile?.username || 'Naval Diver' }}</h3>
            </div>
          </div>

          <!-- Top Section -->
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">PILOT CALL-SIGN</span>
              <span class="stat-val highlight">{{ profile?.profile?.callsign || profile?.callsign || profile?.username || 'Naval Diver' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">USERNAME</span>
              <span class="stat-val">{{ profile?.username || 'Enlisted' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">REGISTERED EMAIL</span>
              <span class="stat-val">{{ profile?.email || 'N/A' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">DIVER CLASS</span>
              <span class="stat-val">
                <span class="class-badge">{{ diverClass }}</span>
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">PILOT BASE</span>
              <span class="stat-val location-val">
                📍 {{ profile?.profile?.city || profile?.city || 'Colombo' }}, {{ profile?.profile?.country || profile?.country || 'Sri Lanka' }} 🇱🇰
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="dossier-divider"></div>

          <!-- Performance History -->
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">OVERALL PERSONAL BEST</span>
              <span class="stat-val highlight">{{ personalBest }} PTS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🦈 LEVEL 1 (SHARKS) BEST</span>
              <span class="stat-val">{{ level1Best }} PTS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🏴‍☠️ LEVEL 2 (PIRATES) BEST</span>
              <span class="stat-val">{{ level2Best }} PTS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🐙 LEVEL 3 (ABYSS) BEST</span>
              <span class="stat-val">{{ level3Best }} PTS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">HIGHEST LEVEL</span>
              <span class="stat-val">{{ highestLevelName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">TOTAL RUNS</span>
              <span class="stat-val">{{ totalRuns }} Missions Completed</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="btn-row" style="margin-top: 2rem;">
            <button class="btn-pill btn-coral" (click)="openEditModal()">
              EDIT PROFILE
            </button>
            <button class="btn-pill btn-white" (click)="goToMenu()">
              MAIN MENU
            </button>
          </div>

          <!-- Log Out Option -->
          <div class="logout-link-wrap">
            <button class="btn-deauth-pill" (click)="onLogout()">
              <span class="logout-icon">🚪</span> Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal Dialog -->
      <div class="edit-modal-backdrop" *ngIf="isEditModalOpen" (click)="closeEditModal()">
        <div class="ocean-glass-card" (click)="$event.stopPropagation()">
          <h2 class="card-title">EDIT PILOT DOSSIER</h2>
          
          <form (ngSubmit)="saveProfile()">
            <div class="field-group">
              <label class="edit-field-label">PILOT CALL-SIGN</label>
              <input 
                type="text" 
                [(ngModel)]="editCallsign" 
                name="editCallsign" 
                class="field-pill" 
                placeholder="Callsign" 
                required 
              />
            </div>

            <div class="field-group">
              <label class="edit-field-label">DIVER CLASS</label>
              <select [(ngModel)]="editDiverClass" name="editDiverClass" class="field-pill select-pill">
                <option value="⚡ Speedster">⚡ Speedster</option>
                <option value="🌊 Deep Explorer">🌊 Deep Explorer</option>
                <option value="🦈 Shark Tamer">🦈 Shark Tamer</option>
                <option value="⚓ Abyssal Diver">⚓ Abyssal Diver</option>
              </select>
            </div>

            <div class="field-group">
              <label class="edit-field-label">DEPLOYMENT CITY</label>
              <input 
                type="text" 
                [(ngModel)]="editCity" 
                name="editCity" 
                class="field-pill" 
                placeholder="City" 
              />
            </div>

            <div class="field-group">
              <label class="edit-field-label">DEPLOYMENT COUNTRY</label>
              <input 
                type="text" 
                [(ngModel)]="editCountry" 
                name="editCountry" 
                class="field-pill" 
                placeholder="Country" 
              />
            </div>

            <div class="btn-row" style="margin-top: 1.5rem;">
              <button type="submit" class="btn-pill btn-coral" [disabled]="saving">
                {{ saving ? 'SAVING...' : 'SAVE DOSSIER' }}
              </button>
              <button type="button" class="btn-pill btn-white" (click)="closeEditModal()">
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dossier-icon {
      font-size: 1.5rem;
    }

    .profile-hero-portrait-wrap {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      padding: 0.9rem 1.1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 18px;
      margin-bottom: 1.2rem;
    }

    .hero-avatar-ring {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #021327;
      border: 2.5px solid #38bdf8;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .profile-hero-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-callsign-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }

    .hero-id-tag {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: #38bdf8;
      text-transform: uppercase;
    }

    .hero-callsign-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }

    .dossier-content {
      margin-top: 1rem;
    }

    .class-badge {
      background: rgba(56, 189, 248, 0.25);
      border: 1px solid #38bdf8;
      color: #e0f2fe;
      padding: 0.25rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.95rem;
    }

    .location-val {
      color: #ffbe3b;
    }

    .dossier-divider {
      height: 1.5px;
      background: rgba(255, 255, 255, 0.25);
      margin: 1.4rem 0;
    }

    .status-box {
      padding: 2.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: #c2e8fa;
    }

    .sonar-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #ff7b54;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .logout-link-wrap {
      margin-top: 1.8rem;
      text-align: center;
      padding-top: 1.2rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.16);
    }

    .btn-deauth-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      width: auto;
      min-width: 180px;
      padding: 0.65rem 1.6rem;
      background: rgba(239, 68, 68, 0.2);
      border: 1.5px solid rgba(239, 68, 68, 0.55);
      border-radius: 9999px;
      color: #fca5a5;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .btn-deauth-pill:hover {
      background: rgba(239, 68, 68, 0.35);
      border-color: #ef4444;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(239, 68, 68, 0.45);
    }

    .btn-deauth-pill:active {
      transform: translateY(1px);
    }

    .logout-icon {
      font-size: 1.1rem;
    }

    /* Edit Modal */
    .edit-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(3, 19, 36, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .edit-field-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #c2e8fa;
      margin-bottom: 0.35rem;
      text-align: left;
    }

    .select-pill {
      appearance: none;
      cursor: pointer;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  loading = true;
  saving = false;
  isEditModalOpen = false;

  diverClass = '⚡ Speedster';
  personalBest = 0;
  level1Best = 0;
  level2Best = 0;
  level3Best = 0;
  totalRuns = 0;
  highestLevelName = 'Level 1 - Shark Waters';

  // Edit fields
  editCallsign = '';
  editDiverClass = '⚡ Speedster';
  editCity = '';
  editCountry = '';

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Immediately load local active user to prevent delay or blank display
    const activeUser = this.authService.getCurrentUser();
    if (activeUser) {
      this.profile = {
        username: activeUser.username,
        email: activeUser.email,
        callsign: activeUser.callsign || activeUser.username,
        country: activeUser.country || 'Sri Lanka',
        city: activeUser.city || 'Colombo',
        profile: {
          callsign: activeUser.callsign || activeUser.username,
          country: activeUser.country || 'Sri Lanka',
          city: activeUser.city || 'Colombo'
        }
      };
      this.editCallsign = activeUser.callsign || activeUser.username;
      this.editCity = activeUser.city || 'Colombo';
      this.editCountry = activeUser.country || 'Sri Lanka';
      this.loading = false;
    }

    const savedClass = localStorage.getItem('oq_diver_class');
    if (savedClass) this.diverClass = savedClass;

    const savedBest = localStorage.getItem('ocean_quest_best_score');
    if (savedBest) this.personalBest = parseInt(savedBest, 10);
    const savedL1 = localStorage.getItem('ocean_quest_level1_best');
    if (savedL1) this.level1Best = parseInt(savedL1, 10);
    const savedL2 = localStorage.getItem('ocean_quest_level2_best');
    if (savedL2) this.level2Best = parseInt(savedL2, 10);
    const savedL3 = localStorage.getItem('ocean_quest_level3_best');
    if (savedL3) this.level3Best = parseInt(savedL3, 10);

    const savedRuns = localStorage.getItem('oq_total_runs');
    if (savedRuns) this.totalRuns = parseInt(savedRuns, 10);

    const savedLvl = localStorage.getItem('ocean_quest_highest_level_cleared');
    const lvlNum = savedLvl ? parseInt(savedLvl, 10) : 0;
    if (lvlNum >= 3) this.highestLevelName = 'Level 3 - Abyss Trench (Mastered)';
    else if (lvlNum === 2) this.highestLevelName = 'Level 3 - Abyss Trench (Unlocked)';
    else if (lvlNum === 1) this.highestLevelName = 'Level 2 - Pirate Cove';
    else this.highestLevelName = 'Level 1 - Shark Waters';

    // 2. Fetch server database record
    this.apiService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.editCallsign = data?.profile?.callsign || data?.callsign || data?.username || '';
        this.editCity = data?.profile?.city || data?.city || 'Colombo';
        this.editCountry = data?.profile?.country || data?.country || 'Sri Lanka';
                if (data?.bestScore !== undefined) {
          this.personalBest = data.bestScore || 0;
          localStorage.setItem('ocean_quest_best_score', String(this.personalBest));
        }
        if (data?.level1Best !== undefined) {
          this.level1Best = data.level1Best || 0;
          localStorage.setItem('ocean_quest_level1_best', String(this.level1Best));
        }
        if (data?.level2Best !== undefined) {
          this.level2Best = data.level2Best || 0;
          localStorage.setItem('ocean_quest_level2_best', String(this.level2Best));
        }
        if (data?.level3Best !== undefined) {
          this.level3Best = data.level3Best || 0;
          localStorage.setItem('ocean_quest_level3_best', String(this.level3Best));
        }
        if (data?.totalRuns !== undefined) {
          this.totalRuns = data.totalRuns || 0;
          localStorage.setItem('oq_total_runs', String(this.totalRuns));
        }
        if (data?.highestLevel !== undefined) {
          const lvl = data.highestLevel;
          if (lvl >= 3) this.highestLevelName = 'Level 3 - Abyss Trench (Mastered)';
          else if (lvl === 2) this.highestLevelName = 'Level 3 - Abyss Trench (Unlocked)';
          else if (lvl === 1) this.highestLevelName = 'Level 2 - Pirate Cove';
          else this.highestLevelName = 'Level 1 - Shark Waters';
          localStorage.setItem('ocean_quest_highest_level_cleared', String(lvl));
        }
      },
      error: () => {
        this.loading = false;
        // Never override with fake dummy data
      }
    });
  }

  openEditModal(): void {
    this.editDiverClass = this.diverClass;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    this.saving = true;
    const payload = {
      callsign: this.editCallsign,
      city: this.editCity,
      country: this.editCountry
    };

    this.apiService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.profile = updated;
        this.diverClass = this.editDiverClass;
        localStorage.setItem('oq_diver_class', this.diverClass);
        // Also update local user cache
        const u = this.authService.getCurrentUser();
        if (u) {
          u.callsign = this.editCallsign;
          u.city = this.editCity;
          u.country = this.editCountry;
          localStorage.setItem('ocean_quest_user', JSON.stringify(u));
        }
        this.closeEditModal();
      },
      error: () => {
        this.saving = false;
        if (this.profile) {
          if (!this.profile.profile) this.profile.profile = {};
          this.profile.profile.callsign = this.editCallsign;
          this.profile.profile.city = this.editCity;
          this.profile.profile.country = this.editCountry;
          this.profile.callsign = this.editCallsign;
          this.profile.city = this.editCity;
          this.profile.country = this.editCountry;
        }
        this.diverClass = this.editDiverClass;
        localStorage.setItem('oq_diver_class', this.diverClass);
        this.closeEditModal();
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToMenu(): void {
    this.router.navigate(['/home']);
  }
}
