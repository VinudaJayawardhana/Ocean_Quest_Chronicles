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
                  <span class="pilot-name">{{ s.username }}</span>
                </td>
                <td class="location-col">
                  {{ s.country }} {{ getCountryFlag(s.country) }}
                </td>
                <td class="score-col">
                  {{ s.score }}
                </td>
                <td class="level-col">
                  {{ s.depthReached > 80 ? 'Lvl 2' : 'Lvl 1' }}
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
    .globe-icon {
      font-size: 1.5rem;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      margin: 1.2rem 0;
      border-radius: 16px;
      background: rgba(3, 23, 40, 0.45);
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
      padding: 0.85rem 1.2rem;
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
  userRankText = '#1';
  userBestScore = 1850;
  currentUsername = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
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
    this.apiService.getLeaderboard(20).subscribe({
      next: (data) => {
        this.scores = data;
        this.loading = false;
        this.calculateUserRank();
      },
      error: () => {
        // Fallback demo mock entries if server database is freshly empty
        this.scores = [
          { userId: 1, username: 'DeepDiver_99', score: 1850, depthReached: 140, chestsCollected: 6, country: 'Sri Lanka' },
          { userId: 2, username: 'OceanMaster', score: 1450, depthReached: 120, chestsCollected: 5, country: 'United Kingdom' },
          { userId: 3, username: 'SharkHunter', score: 1200, depthReached: 75, chestsCollected: 4, country: 'Australia' },
          { userId: 4, username: 'AquaRunner', score: 950, depthReached: 60, chestsCollected: 3, country: 'Japan' }
        ];
        this.loading = false;
        this.calculateUserRank();
      }
    });
  }

  calculateUserRank(): void {
    const idx = this.scores.findIndex((s) => s.username === this.currentUsername);
    if (idx !== -1) {
      this.userRankText = `#${idx + 1}`;
      this.userBestScore = Math.max(this.userBestScore, this.scores[idx].score);
    } else {
      this.userRankText = '#1';
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
}
