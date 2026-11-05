/**
 * Ocean Quest Chronicles Project (see docs/references.md).
 */
import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { GameEngineService, GameState, SharkEntity, PirateEntity, ChestEntity, OctopusEntity, GuardEntity } from '../../services/game-engine.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SoundService } from '../../services/sound.service';
import { MarineService } from '../../services/marine.service';
import { MarineTelemetry } from '../../models/marine-telemetry.model';
import { PuzzleChallenge } from '../../models/fish-api.model';
import { GameEventBus } from '../../services/event-bus.service';

@Component({
  selector: 'app-game-viewport',
  templateUrl: './game-viewport.component.html',
  styleUrls: ['./game-viewport.component.css']
})
export class GameViewportComponent implements OnInit, OnDestroy {
  @ViewChild('oceanStage') oceanStageRef?: ElementRef<HTMLDivElement>;

  gameState: GameState = this.gameEngine.currentState;
  private stateSub?: Subscription;

  // Marc Conrad Fish Game API & 2-Phase Sonar Challenge State
  currentPuzzle: PuzzleChallenge | null = null;
  puzzlePhase: 'memorize' | 'answer' = 'memorize';
  memorizeTimer: number = 5;
  answerTimer: number = 5;
  puzzleOptions: number[] = [3, 5, 7];
  private puzzleCountdownInterval?: any;

  apiError = '';
  submitting = false;
  private scoreSaved = false;
  puzzleLoading = false;
  userAnswer: number | null = null;
  puzzleMessage = '';
  isPuzzleSuccess = false;
  activeChestId: number | null = null;

  // UI Flow Modals (Matching PDF Screens 4, 7, 8, 9, 11)
  isSettingsOpen = false;
  isLevelComplete = false;
  completedLevelNumber: number = 1;
  isVictory = false;
  isGameOverModal = false;
  isHighScoreModal = false;

  // Pilot Telemetry & Statistics
  pilotCallsign = 'DeepDiver_99';
  pilotLocation = 'Colombo, Sri Lanka 🇱🇰';
  bestScore = 1850;
  correctAnswers = 0;
  survivalSeconds = 0;
  private timerInterval?: any;

  // Cached sanitized iframe URLs for smooth level rendering
  level1BgUrl: SafeResourceUrl;
  level2BgUrl: SafeResourceUrl;
  level3BgUrl: SafeResourceUrl;

  constructor(
    public gameEngine: GameEngineService,
    public marineService: MarineService,
    private apiService: ApiService,
    public authService: AuthService,
    public soundService: SoundService,
    private sanitizer: DomSanitizer,
    private bus: GameEventBus,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.level1BgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/background/level1/Level 1 - Shark Waters (animated background).html'
    );
    this.level2BgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/background/level2/Level 2 - Pirate Cove (animated background).html'
    );
    this.level3BgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/background/level3/Level 3-Final_Level.html'
    );
  }

  get currentTelemetry(): MarineTelemetry {
    return this.marineService.currentTelemetry;
  }

  get isNightDive(): boolean {
    return this.currentTelemetry.isNightDive;
  }

  get currentBgUrl(): SafeResourceUrl {
    if (this.gameState.level === 1) return this.level1BgUrl;
    if (this.gameState.level === 2) return this.level2BgUrl;
    return this.level3BgUrl;
  }

  get scoreFormatted(): string {
    return String(this.gameState.score).padStart(10, '0');
  }

  get dangerPercent(): number {
    return Math.min(100, Math.max(0, 100 - this.gameState.oxygen));
  }

  get livesCount(): number {
    return this.gameState.lives;
  }

  get formattedSurvivalTime(): string {
    const m = Math.floor(this.survivalSeconds / 60);
    const s = this.survivalSeconds % 60;
    return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  get hintNotificationText(): string {
    if (this.currentPuzzle) {
      if (this.puzzlePhase === 'memorize') {
        return `Phase 1: Memorize the count! (${this.memorizeTimer}s remaining)`;
      } else {
        return `Phase 2: Pick the correct count! (${this.answerTimer}s remaining)`;
      }
    }
    if (this.gameState.oxygen <= 25) {
      return '⚠️ LOW OXYGEN! Catch +O₂ bubbles to breathe!';
    }
    const nearChest = this.gameState.chests.find((c) => c.nearPlayer && !c.opened);
    if (nearChest) return 'Chest detected! Press [E] or Click to solve Sonar Challenge!';
    return 'Swim! Arrow keys / WASD (Hold Shift to sprint)';
  }

  ngOnInit(): void {
    // Check if a starting level was requested via queryParams (e.g. from Level Map)
    this.route.queryParams.subscribe((params) => {
      const lvlParam = parseInt(params['level'], 10);
      if (lvlParam === 1 || lvlParam === 2 || lvlParam === 3) {
        this.startGame(lvlParam as 1 | 2 | 3);
      }
    });

    // Load Pilot Info
    this.apiService.getProfile().subscribe({
      next: (p) => {
        if (p?.profile?.callsign) this.pilotCallsign = p.profile.callsign;
        else if (p?.username) this.pilotCallsign = p.username;
        if (p?.profile?.city && p?.profile?.country) {
          this.pilotLocation = `${p.profile.city}, ${p.profile.country} 🇱🇰`;
        }
      }
    });

    this.marineService.telemetry$.subscribe({
      next: (t) => {
        if (t && t.city && t.country && (!this.pilotLocation || this.pilotLocation.includes('Colombo'))) {
          this.pilotLocation = `${t.city}, ${t.country} ${t.flag}`;
        }
      }
    });

    const savedBest = localStorage.getItem('ocean_quest_best_score');
    if (savedBest) {
      this.bestScore = parseInt(savedBest, 10);
    }

    this.stateSub = this.gameEngine.state$.subscribe((state) => {
      this.gameState = state;
      if (state.isGameOver && !this.isGameOverModal && !this.isVictory && !this.isLevelComplete) {
        this.handleGameOver();
      }
    });
  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
    this.gameEngine.stopGame();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.puzzleCountdownInterval) clearInterval(this.puzzleCountdownInterval);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.currentPuzzle) return;

    if (event.key === 'Shift') {
      this.gameEngine.setSprint(true);
      return;
    }

    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault();
      this.gameEngine.handleKeyDown(event.key);
    } else if (key === 'e' || key === ' ') {
      const nearChest = this.gameState.chests.find((c) => c.nearPlayer && !c.opened);
      if (nearChest) {
        event.preventDefault();
        this.openChestPuzzle(nearChest.id);
      }
    } else if (key === 'p') {
      this.gameEngine.togglePause();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (this.currentPuzzle) return;
    if (event.key === 'Shift') {
      this.gameEngine.setSprint(false);
      return;
    }
    this.gameEngine.handleKeyUp(event.key);
  }

  onStageClick(event: MouseEvent): void {
    if (!this.oceanStageRef || !this.gameState.isPlaying || this.currentPuzzle) return;
    const rect = this.oceanStageRef.nativeElement.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;
    this.gameEngine.moveDiverTowards(clickX, clickY);
    this.bus.emit({ type: 'Swim' });
  }

  onDirectionButtonDown(dir: 'up' | 'down' | 'left' | 'right'): void {
    const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    this.gameEngine.handleKeyDown(keyMap[dir]);
    this.bus.emit({ type: 'Swim' });
  }

  onDirectionButtonUp(dir: 'up' | 'down' | 'left' | 'right'): void {
    const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    this.gameEngine.handleKeyUp(keyMap[dir]);
  }

  startGame(level: 1 | 2 | 3 = 1): void {
    this.closeAllModals();
    this.closePuzzle();
    this.scoreSaved = false;
    this.apiError = '';
    this.survivalSeconds = 0;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.gameState.isPlaying && !this.gameState.isPaused && !this.gameState.isGameOver) {
        this.survivalSeconds++;
      }
    }, 1000);

    this.gameEngine.startGame(level);

    this.apiService.startRun().subscribe({
      error: () => (this.apiError = 'Could not start a verified dive. Please log in again.')
    });
  }

  switchLevel(level: 1 | 2 | 3): void {
    this.gameEngine.setLevel(level);
  }

  togglePause(): void {
    this.gameEngine.togglePause();
  }

  toggleMute(): void {
    this.soundService.toggleMute();
  }

  openSettings(): void {
    this.isSettingsOpen = true;
  }

  closeSettings(): void {
    this.isSettingsOpen = false;
  }

  closeAllModals(): void {
    this.isSettingsOpen = false;
    this.isLevelComplete = false;
    this.isVictory = false;
    this.isGameOverModal = false;
    this.isHighScoreModal = false;
  }

  getDiverTransform(): string {
    const diver = this.gameState.diver;
    return `translate3d(-50%, -50%, 0) rotate(${Math.round(diver.pitch || 0)}deg)`;
  }

  getDiverSpritePosition(): string {
    const diver = this.gameState.diver;
    let frameIdx = 0;
    if (diver.state === 'scared') frameIdx = 4;
    else if (diver.state === 'hurt') frameIdx = 5;
    else if (diver.state === 'celebrate') frameIdx = 6;
    else if (diver.state === 'defeated') frameIdx = 7;
    else frameIdx = diver.frame % 4;

    const xOffset = -(frameIdx * 150);
    return `${xOffset}px 0px`;
  }

  getDiverSpriteSheetUrl(): string {
    return `assets/sprites/diver/diver_spritesheet_${this.gameState.diver.facing}.png`;
  }

  getSharkSpritePosition(shark: SharkEntity): string {
    let frameIdx = 0;
    if (shark.state === 'bite') frameIdx = 4;
    else if (shark.state === 'defeated') frameIdx = 5;
    else frameIdx = shark.frame % 4;

    const xOffset = -(frameIdx * 150);
    return `${xOffset}px 0px`;
  }

  getSharkSpriteSheetUrl(shark: SharkEntity): string {
    return `assets/sprites/shark/shark_spritesheet_${shark.facing}.png`;
  }

  getPirateSpritePosition(pirate: PirateEntity): string {
    let frameIdx = 0;
    if (pirate.state === 'attack') {
      frameIdx = 3 + Math.min(3, Math.max(1, pirate.attackFrame));
    } else if (pirate.state === 'defeated') {
      frameIdx = 7;
    } else {
      frameIdx = pirate.frame % 4;
    }

    const xOffset = -(frameIdx * 140);
    return `${xOffset}px 0px`;
  }

  getPirateSpriteSheetUrl(pirate: PirateEntity): string {
    return `assets/sprites/pirate/pirate_spritesheet_${pirate.facing}.png`;
  }

  // ── Level 3 Octopus & Guard Sprite Helpers ────────────────────────────────
  getOctopusSpritePosition(octopus: OctopusEntity): string {
    const frameIdx = octopus.frame % 14;
    return `${-(frameIdx * 120)}px 0px`;
  }

  getOctopusSpriteSheetUrl(octopus: OctopusEntity): string {
    return `assets/sprites/octopus/octopus-sprites/octopus_spritesheet_${octopus.facing}.png`;
  }

  getGuardSpritePosition(guard: GuardEntity): string {
    const frameIdx = guard.frame % 15;
    return `${-(frameIdx * 120)}px 0px`;
  }

  getGuardSpriteSheetUrl(guard: GuardEntity): string {
    return `assets/sprites/guard/guard-sprites/guard_spritesheet_${guard.facing}.png`;
  }


  /**
   * 2-Phase Sonar Challenge (Memory + Quick Answer)
   * Safely pauses predator attacks and game physics while solving!
   */
  openChestPuzzle(chestId: number): void {
    if (this.puzzleLoading || this.currentPuzzle) return;
    this.activeChestId = chestId;
    this.puzzleLoading = true;
    this.puzzleMessage = '';
    this.apiError = '';
    this.userAnswer = null;
    this.puzzlePhase = 'memorize';
    this.memorizeTimer = 5;
    this.answerTimer = 5;

    // IMMUNITY FIX: Pause enemy movement and attacks while solving the puzzle
    this.gameEngine.setPuzzlePause(true);
    this.bus.emit({ type: 'PuzzleRequested' });

    this.apiService.newPuzzle().subscribe({
      next: (puzzle) => {
        this.currentPuzzle = puzzle;
        this.puzzleLoading = false;
        this.puzzleOptions = puzzle.options && puzzle.options.length === 3 ? puzzle.options : [3, 5, 7];
        this.bus.emit({ type: 'PuzzleLoaded' });
        this.startMemorizePhase();
      },
      error: (err) => {
        this.puzzleLoading = false;
        this.activeChestId = null;
        this.gameEngine.setPuzzlePause(false); // Resume if load fails
        this.apiError = err?.error?.error || 'The sonar is offline. Try the chest again in a moment.';
        setTimeout(() => (this.apiError = ''), 4000);
      }
    });
  }

  private startMemorizePhase(): void {
    this.puzzlePhase = 'memorize';
    this.memorizeTimer = 5;
    if (this.puzzleCountdownInterval) clearInterval(this.puzzleCountdownInterval);

    this.puzzleCountdownInterval = setInterval(() => {
      this.memorizeTimer--;
      if (this.memorizeTimer <= 0) {
        clearInterval(this.puzzleCountdownInterval);
        this.startAnswerPhase();
      }
    }, 1000);
  }

  private startAnswerPhase(): void {
    this.puzzlePhase = 'answer';
    this.answerTimer = 5;
    this.userAnswer = null;
    if (this.puzzleCountdownInterval) clearInterval(this.puzzleCountdownInterval);

    this.puzzleCountdownInterval = setInterval(() => {
      this.answerTimer--;
      if (this.answerTimer <= 0) {
        clearInterval(this.puzzleCountdownInterval);
        this.handlePuzzleTimeout();
      }
    }, 1000);
  }

  private handlePuzzleTimeout(): void {
    if (!this.currentPuzzle || this.submitting) return;
    this.isPuzzleSuccess = false;
    this.puzzleMessage = '⏰ Time expired (5s)! Lost 1 Life Point.';
    this.gameEngine.takeLifeDamage('puzzle');
    setTimeout(() => this.closePuzzle(true), 1800);
  }

  selectAnswerOption(choice: number): void {
    if (this.submitting || this.puzzlePhase !== 'answer' || !this.currentPuzzle) return;
    this.userAnswer = choice;
    if (this.puzzleCountdownInterval) clearInterval(this.puzzleCountdownInterval);

    this.submitting = true;
    this.apiService.answerPuzzle(this.currentPuzzle.puzzleId, choice).subscribe({
      next: (r) => {
        this.submitting = false;
        this.bus.emit({ type: 'AnswerChecked', correct: r.correct, points: r.points });
        this.isPuzzleSuccess = r.correct;
        if (r.correct) {
          this.correctAnswers++;
          this.puzzleMessage = `🎉 Correct (${r.solution} fish)! Mystery Box unlocked (+${r.points} pts)!`;
          this.gameEngine.collectChest(r.points);
          const chest = this.gameState.chests.find((item) => item.id === this.activeChestId);
          if (chest) chest.opened = true;

          // FREEZE game & predators completely so no damage can occur
          this.gameEngine.setPuzzlePause(true);

          setTimeout(() => {
            const currentLevel = this.gameState.level;
            // Stop game engine completely so sharks/enemies cannot attack after level is cleared!
            this.gameEngine.stopGame();
            this.closePuzzle(false);

            // Record cleared level in localStorage for progressive unlocking
            const prevCleared = parseInt(localStorage.getItem('ocean_quest_highest_level_cleared') || '0', 10);
            if (currentLevel > prevCleared) {
              localStorage.setItem('ocean_quest_highest_level_cleared', String(currentLevel));
            }

            if (currentLevel === 1) {
              this.completedLevelNumber = 1;
              this.isLevelComplete = true; // Level 1 Complete modal (unlocks Level 2)
            } else if (currentLevel === 2) {
              this.completedLevelNumber = 2;
              this.isLevelComplete = true; // Level 2 Complete modal (unlocks Level 3)
            } else {
              this.handleVictory(); // Level 3 Complete (Full Game Victory!)
            }
          }, 1800);
        } else {
          this.puzzleMessage = `❌ Incorrect! Real count: ${r.solution}. Lost 1 Life Point.`;
          this.gameEngine.takeLifeDamage('puzzle');
          setTimeout(() => this.closePuzzle(true), 1800);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.isPuzzleSuccess = false;
        this.puzzleMessage = err?.error?.error || 'Answer verification error. Lost 1 Life Point.';
        this.gameEngine.takeLifeDamage('puzzle');
        setTimeout(() => this.closePuzzle(true), 1800);
      }
    });
  }

  setNumericAnswer(num: number): void {
    this.userAnswer = num;
  }

  submitPuzzleAnswer(): void {
    if (this.userAnswer !== null) {
      this.selectAnswerOption(this.userAnswer);
    }
  }

  closePuzzle(resumeGame: boolean = true): void {
    if (this.puzzleCountdownInterval) clearInterval(this.puzzleCountdownInterval);
    this.currentPuzzle = null;
    this.isPuzzleSuccess = false;
    this.puzzleMessage = '';
    this.activeChestId = null;
    this.puzzlePhase = 'memorize';
    // Resume physics only if game is still actively being played (not on level complete, victory, or game over)
    if (resumeGame && !this.isLevelComplete && !this.isVictory && !this.isGameOverModal) {
      this.gameEngine.setPuzzlePause(false);
    }
  }

  proceedToNextLevel(): void {
    const nextLvl = (this.completedLevelNumber + 1) as 2 | 3;
    this.isLevelComplete = false;
    this.startGame(nextLvl);
  }

  proceedToLevel2(): void {
    this.proceedToNextLevel();
  }

  goToLevelMap(): void {
    this.closeAllModals();
    this.closePuzzle();
    this.gameEngine.stopGame();
    this.router.navigate(['/levels']);
  }

  private handleVictory(): void {
    this.saveFinalScore();
    const isNewRecord = this.gameState.score > this.bestScore;
    if (isNewRecord) {
      this.bestScore = this.gameState.score;
      localStorage.setItem('ocean_quest_best_score', String(this.bestScore));
      this.isHighScoreModal = true;
    } else {
      this.isVictory = true;
    }
  }

  private handleGameOver(): void {
    this.saveFinalScore();
    const isNewRecord = this.gameState.score > this.bestScore && this.gameState.score > 0;
    if (isNewRecord) {
      this.bestScore = this.gameState.score;
      localStorage.setItem('ocean_quest_best_score', String(this.bestScore));
      this.isHighScoreModal = true;
    } else {
      this.isGameOverModal = true;
    }
  }

  private saveFinalScore(): void {
    if (this.scoreSaved || this.gameState.score <= 0) return;
    this.scoreSaved = true;

    // Increment runs
    const currentRuns = parseInt(localStorage.getItem('oq_total_runs') || '14', 10) + 1;
    localStorage.setItem('oq_total_runs', String(currentRuns));

    const exploration = Math.max(0, this.gameState.score - this.gameState.chestsCollected * 250);
    this.apiService.saveScore({ depthReached: this.gameState.depth, explorationScore: exploration }).subscribe({
      next: () => console.log('Score synced with global naval fleet.'),
      error: (err) => console.error('Score sync failed:', err)
    });
  }

  goToMainMenu(): void {
    this.closeAllModals();
    this.closePuzzle();
    this.gameEngine.stopGame();
    this.router.navigate(['/']);
  }

  goToLeaderboard(): void {
    this.closeAllModals();
    this.closePuzzle();
    this.gameEngine.stopGame();
    this.router.navigate(['/leaderboard']);
  }
}
