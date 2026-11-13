import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LeaderboardEntry } from '../../models/user.model';

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="ocean-screen-layout">
      <div class="ocean-glass-card extra-wide">
        <!-- Header with Globe Icon (Screen 12) -->
        <h2 class="card-title">
          <span class="globe-icon">🌐</span> GLOBAL DIVER LEADERBOARD
        </h2>
        <p class="card-subtitle">Verified deep-sea exploration records and sonar decoders</p>

        <!-- Sector Level Filter Tabs -->
        <div class="leaderboard-filter-bar">
          <button 
            type="button"
            class="filter-pill" 
            [class.active]="selectedLevelFilter === null" 
            (click)="setLevelFilter(null)"
          >
            🌐 ALL SECTORS
          </button>
          <button 
            type="button"
            class="filter-pill" 
            [class.active]="selectedLevelFilter === 1" 
            (click)="setLevelFilter(1)"
          >
            🦈 LEVEL 1 (SHARKS)
          </button>
          <button 
            type="button"
            class="filter-pill" 
            [class.active]="selectedLevelFilter === 2" 
            (click)="setLevelFilter(2)"
          >
            🏴‍☠️ LEVEL 2 (PIRATES)
          </button>
          <button 
            type="button"
            class="filter-pill" 
            [class.active]="selectedLevelFilter === 3" 
            (click)="setLevelFilter(3)"
          >
            🐙 LEVEL 3 (ABYSS)
          </button>
        </div>

        <!-- Loading / Empty / Table States -->
        <div *ngIf="loading" class="status-msg">
          <div class="sonar-spinner"></div>
          Scanning global satellite logs...
        </div>

        <div class="table-responsive" *ngIf="!loading && scores.length > 0">
          <table class="ocean-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>PILOT CALL-SIGN</th>
                <th>LOCATION</th>
                <th>SCORE</th>
                <th>LEVEL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of scores; let idx = index" [class.current-user-row]="isCurrentPilot(s.username)">
                <td class="rank-col">
                  <span class="rank-badge" [ngClass]="getRankClass(idx)">
                    #{{ idx + 1 }}
                  </span>
                </td>
                <td class="pilot-col">
                  <div class="pilot-cell-flex">
                    <img 
                      [src]="authService.getDiverAvatar(s.username, getEntryLevel(s))" 
                      alt="Avatar" 
                      class="leaderboard-avatar-img" 
                      [class.avatar-glow-lvl1]="getEntryLevel(s) === 1"
                      [class.avatar-glow-lvl2]="getEntryLevel(s) === 2"
                      [class.avatar-glow-lvl3]="getEntryLevel(s) === 3"
                      width="28" 
                      height="28"
                      (error)="authService.handleAvatarError($event, getEntryLevel(s))"
                    />
                    <span class="pilot-name">{{ s.username }}</span>
                  </div>
                </td>
                <td class="location-col">
                  {{ s.country }} {{ getCountryFlag(s.country) }}
                </td>
                <td class="score-col">
                  {{ s.score }}
                </td>
                <td class="level-col">
                  <span class="level-rank-badge" [ngClass]="getLevelBadgeClass(s)">
                    <span class="lvl-icon">{{ getLevelIcon(s) }}</span>
                    <span class="lvl-text">{{ getLevelShortName(s) }}</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="!loading && scores.length === 0" class="status-msg">
          No exploration records found. Dive in and claim Rank #1!
        </div>

        <!-- Highlight Summary Box (Screen 12) -->
        <div class="leaderboard-summary-box">
          <div class="summary-item">
            <span class="summary-label">YOUR RANK:</span>
            <span class="summary-value">{{ userRankText }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <span class="summary-label">YOUR BEST:</span>
            <span class="summary-value">{{ userBestScore }} PTS</span>
          </div>
        </div>

        <!-- Action Buttons (Screen 12: Refresh & Back to Menu) -->
        <div class="btn-row" style="margin-top: 1.5rem;">
          <button class="btn-pill btn-coral" (click)="loadLeaderboard()">
            REFRESH
          </button>
          <button class="btn-pill btn-white" (click)="goToMenu()">
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Transparent Frosted Glassmorphism for Leaderboard Card */
    .ocean-glass-card.extra-wide {
      background: rgba(4, 20, 38, 0.65) !important;
      backdrop-filter: blur(22px) saturate(1.5) !important;
      -webkit-backdrop-filter: blur(22px) saturate(1.5) !important;
      border: 1.5px solid rgba(56, 189, 248, 0.45) !important;
      box-shadow: 0 25px 65px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2) !important;
      border-radius: 28px;
    }

    .pilot-cell-flex {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      white-space: nowrap;
      vertical-align: middle;
    }

    .leaderboard-avatar-img {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      max-width: 28px !important;
      border-radius: 50% !important;
      border: 1.5px solid #38bdf8 !important;
      background: #021327 !important;
      object-fit: cover !important;
      flex-shrink: 0 !important;
      display: inline-block !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .level-rank-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .level-rank-badge.badge-lvl1 {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
    }

    .level-rank-badge.badge-lvl2 {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.45);
      color: #fbbf24;
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
    }

    .level-rank-badge.badge-lvl3 {
      background: rgba(192, 132, 252, 0.18);
      border: 1px solid rgba(192, 132, 252, 0.5);
      color: #c084fc;
      box-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
    }

    .leaderboard-avatar-img.avatar-glow-lvl1 {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4) !important;
    }

    .leaderboard-avatar-img.avatar-glow-lvl2 {
      border-color: #fbbf24 !important;
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.45) !important;
    }

    .leaderboard-avatar-img.avatar-glow-lvl3 {
      border-color: #c084fc !important;
      box-shadow: 0 0 10px rgba(192, 132, 252, 0.55) !important;
    }

    .pilot-name {
      font-weight: 700;
      color: #ffffff;
    }


    .leaderboard-filter-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin: 1.2rem 0 0.6rem 0;
    }

    .filter-pill {
      background: rgba(3, 25, 43, 0.65);
      color: #c2e8fa;
      border: 1.5px solid rgba(56, 189, 248, 0.25);
      border-radius: 9999px;
      padding: 0.45rem 1.15rem;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.6px;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .filter-pill:hover {
      background: rgba(14, 82, 119, 0.75);
      border-color: rgba(56, 189, 248, 0.6);
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .filter-pill.active {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .globe-icon {
      font-size: 1.5rem;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      margin: 1.2rem 0;
      border-radius: 16px;
      background: rgba(2, 14, 28, 0.55);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .ocean-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.95rem;
    }

    .ocean-table th {
      padding: 0.9rem 1.2rem;
      background: rgba(14, 82, 119, 0.8);
      color: #c2e8fa;
      font-weight: 800;
      letter-spacing: 0.8px;
      font-size: 0.85rem;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    }

    .ocean-table td {
      padding: 0.65rem 1rem;
      vertical-align: middle;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      font-weight: 600;
    }

    .ocean-table tr:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .current-user-row {
      background: rgba(255, 123, 84, 0.18) !important;
      border-left: 4px solid #ff7b54;
    }

    .rank-badge {
      display: inline-block;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }

    .rank-gold {
      background: #ffbe3b;
      color: #041c30;
      box-shadow: 0 2px 8px rgba(255, 190, 59, 0.4);
    }

    .rank-silver {
      background: #e2e8f0;
      color: #041c30;
    }

    .rank-bronze {
      background: #d97706;
      color: #ffffff;
    }

    .score-col {
      font-weight: 800;
      color: #ffbe3b;
      font-size: 1.05rem;
    }

    .status-msg {
      padding: 2.5rem 1rem;
      color: #c2e8fa;
      font-size: 1.05rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
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

    /* Leaderboard Summary Box (Screen 12) */
    .leaderboard-summary-box {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: rgba(3, 23, 40, 0.65);
      border: 1.5px dashed rgba(255, 255, 255, 0.35);
      border-radius: 18px;
      padding: 0.9rem 1.5rem;
      margin-top: 1rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .summary-label {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #c2e8fa;
    }

    .summary-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
    }

    .summary-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.25);
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  scores: LeaderboardEntry[] = [];
  loading = true;
  userRankText = 'Unranked';
  userBestScore = 0;
  currentUsername = '';
  selectedLevelFilter: number | null = null;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.currentUsername = u.username;
      }
    });

    const savedBest = localStorage.getItem('ocean_quest_best_score');
    if (savedBest) {
      this.userBestScore = parseInt(savedBest, 10);
    }

    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading = true;
    this.apiService.getLeaderboard(25, this.selectedLevelFilter).subscribe({
      next: (data) => {
        this.scores = data;
        this.loading = false;
        this.calculateUserRank();
      },
      error: () => {
        let mock: LeaderboardEntry[] = [
          { userId: 1, username: 'DeepDiver_99', score: 1850, depthReached: 290, chestsCollected: 6, country: 'Sri Lanka', level: 3 },
          { userId: 2, username: 'OceanMaster', score: 1450, depthReached: 180, chestsCollected: 5, country: 'United Kingdom', level: 2 },
          { userId: 3, username: 'SharkHunter', score: 1200, depthReached: 75, chestsCollected: 4, country: 'Australia', level: 1 },
          { userId: 4, username: 'AquaRunner', score: 950, depthReached: 60, chestsCollected: 3, country: 'Japan', level: 1 }
        ];
        if (this.selectedLevelFilter !== null) {
          mock = mock.filter((m) => m.level === this.selectedLevelFilter);
        }
        this.scores = mock;
        this.loading = false;
        this.calculateUserRank();
      }
    });
  }

  setLevelFilter(lvl: number | null): void {
    if (this.selectedLevelFilter === lvl) return;
    this.selectedLevelFilter = lvl;
    this.loadLeaderboard();
  }

  calculateUserRank(): void {
    const idx = this.scores.findIndex((s) => s.username === this.currentUsername);
    if (idx !== -1) {
      this.userRankText = `#${idx + 1}`;
      this.userBestScore = Math.max(this.userBestScore, this.scores[idx].score);
    } else {
      this.userRankText = 'Unranked';
    }
  }

  isCurrentPilot(username: string): boolean {
    return !!this.currentUsername && username.toLowerCase() === this.currentUsername.toLowerCase();
  }

  getRankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  }

  /**
   * Maps depth reached to the level label for the leaderboard.
   * Level 1 (Shark Waters): depth < 140m
   * Level 2 (Pirate Cove): depth 140–279m
   * Level 3 (Abyss Trench): depth >= 280m
   */
  getEntryLevel(entry: LeaderboardEntry): number {
    if (entry.level === 3 || entry.depthReached >= 280) return 3;
    if (entry.level === 2 || (entry.depthReached >= 140 && entry.depthReached < 280)) return 2;
    return entry.level || 1;
  }

  getLevelBadgeClass(entry: LeaderboardEntry): string {
    const lvl = this.getEntryLevel(entry);
    return `badge-lvl${lvl}`;
  }

  getLevelIcon(entry: LeaderboardEntry): string {
    const lvl = this.getEntryLevel(entry);
    if (lvl === 3) return '🐙';
    if (lvl === 2) return '🏴‍☠️';
    return '🦈';
  }

  getLevelShortName(entry: LeaderboardEntry): string {
    const lvl = this.getEntryLevel(entry);
    if (lvl === 3) return 'LVL 3 ABYSS';
    if (lvl === 2) return 'LVL 2 COVE';
    return 'LVL 1 REEF';
  }

  getLevelLabel(entry: LeaderboardEntry): string {
    if (entry.level === 3 || entry.depthReached >= 280) return 'Lvl 3 (Abyss)';
    if (entry.level === 2 || entry.depthReached >= 140) return 'Lvl 2 (Pirate)';
    return 'Lvl 1 (Shark)';
  }

  getCountryFlag(country: string): string {
    const map: { [c: string]: string } = {
      'Sri Lanka': '🇱🇰',
      'United Kingdom': '🇬🇧',
      'UK': '🇬🇧',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'Germany': '🇩🇪',
      'Canada': '🇨🇦'
    };
    return map[country] || '🌐';
  }

  goToMenu(): void {
    this.router.navigate(['/']);
  }

  /**
   * VIRTUAL IDENTITY: Avatar fallback if DiceBear CDN is unreachable.
   * Swaps the broken img to a data-URI colored robot SVG matching the pilot's level color.
   */
  onAvatarError(event: Event, level: number): void {
    this.authService.handleAvatarError(event, level);
  }
}
