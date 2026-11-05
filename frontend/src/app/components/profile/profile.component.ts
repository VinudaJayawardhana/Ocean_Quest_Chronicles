import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="ocean-screen-layout">
      <div class="ocean-glass-card wide">
        <!-- Header (Screen 13) -->
        <h2 class="card-title">
          <span class="dossier-icon">🤿</span> PILOT PROFILE DOSSIER
        </h2>
        <p class="card-subtitle">Official credentials and telemetry history recorded by naval command</p>

        <div *ngIf="loading" class="status-box">
          <div class="sonar-spinner"></div>
          Retrieving naval dossier...
        </div>

        <div *ngIf="!loading && profile" class="dossier-content">
          <!-- Top Section -->
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">CALL-SIGN</span>
              <span class="stat-val">{{ profile?.profile?.callsign || profile?.username || 'DeepDiver_99' }}</span>
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
                📍 {{ profile?.profile?.city || 'Colombo' }}, {{ profile?.profile?.country || 'Sri Lanka' }} 🇱🇰
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="dossier-divider"></div>

          <!-- Performance History -->
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">PERSONAL BEST</span>
              <span class="stat-val highlight">{{ personalBest }} PTS</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">HIGHEST LEVEL</span>
              <span class="stat-val">Level 2 (Pirate Cove)</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">TOTAL RUNS</span>
              <span class="stat-val">{{ totalRuns }} Missions Completed</span>
            </div>
          </div>

          <!-- Action Buttons (Screen 13: Edit Profile & Main Menu) -->
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
            <button class="btn-deauth" (click)="onLogout()">
              De-authorize & Log Out
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
      margin-top: 1.6rem;
      text-align: center;
    }

    .btn-deauth {
      background: none;
      border: none;
      color: #ff7b54;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s;
    }

    .btn-deauth:hover {
      color: #ff5238;
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
  personalBest = 1850;
  totalRuns = 14;

  // Edit fields
  editCallsign = '';
  editDiverClass = '⚡ Speedster';
  editCity = '';
  editCountry = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const savedClass = localStorage.getItem('oq_diver_class');
    if (savedClass) this.diverClass = savedClass;

    const savedBest = localStorage.getItem('ocean_quest_best_score');
    if (savedBest) this.personalBest = parseInt(savedBest, 10);

    const savedRuns = localStorage.getItem('oq_total_runs');
    if (savedRuns) this.totalRuns = parseInt(savedRuns, 10);

    this.apiService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.editCallsign = data?.profile?.callsign || data?.username || '';
        this.editCity = data?.profile?.city || 'Colombo';
        this.editCountry = data?.profile?.country || 'Sri Lanka';
      },
      error: () => {
        this.loading = false;
        // Mock fallback if session demo
        this.profile = {
          username: 'DeepDiver_99',
          profile: {
            callsign: 'DeepDiver_99',
            city: 'Colombo',
            country: 'Sri Lanka'
          }
        };
        this.editCallsign = 'DeepDiver_99';
        this.editCity = 'Colombo';
        this.editCountry = 'Sri Lanka';
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
        this.closeEditModal();
      },
      error: () => {
        this.saving = false;
        if (this.profile) {
          if (!this.profile.profile) this.profile.profile = {};
          this.profile.profile.callsign = this.editCallsign;
          this.profile.profile.city = this.editCity;
          this.profile.profile.country = this.editCountry;
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
    this.router.navigate(['/']);
  }
}
