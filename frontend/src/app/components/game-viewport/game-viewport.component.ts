/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md).
 * Scaffolded with an AI assistant and reviewed/edited by the author.
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

  // 3-2-1 Sonar Chest Decryption Countdown
  isChestCountdown = false;

  // Collapsible & Shrinkable Top-Right HUD Bar
  isHudCollapsed = false;

  toggleHudCollapse(): void {
    this.isHudCollapsed = !this.isHudCollapsed;
    localStorage.setItem('oq_hud_collapsed', String(this.isHudCollapsed));
  }
  chestCountdownTimer = 3;
  private chestCountdownInterval?: any;
  private pendingPuzzleData: PuzzleChallenge | null = null;

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
  pilotCallsign = 'Naval Diver';
  pilotLocation = 'Colombo, Sri Lanka 🇱🇰';
  bestScore = 0;
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

  get currentAtmosphere(): 'day' | 'sunset' | 'night' {
    return this.marineService.currentAtmosphere;
  }

  get isNightDive(): boolean {
    return this.currentAtmosphere === 'night';
  }

  get isSunsetDive(): boolean {
    return this.currentAtmosphere === 'sunset';
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
    const savedHud = localStorage.getItem('oq_hud_collapsed');
    if (savedHud === 'true') {
      this.isHudCollapsed = true;
    }
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
    if (this.chestCountdownInterval) clearInterval(this.chestCountdownInterval);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.currentPuzzle || this.isChestCountdown) return;

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
    if (this.currentPuzzle || this.isChestCountdown) return;
    if (event.key === 'Shift') {
      this.gameEngine.setSprint(false);
      return;
    }
    this.gameEngine.handleKeyUp(event.key);
  }

  onStageClick(event: MouseEvent): void {
    if (!this.oceanStageRef || !this.gameState.isPlaying || this.currentPuzzle || this.isChestCountdown) return;
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
    this.updateBackgroundAnimationState(false);
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
    this.soundService.speakNavalDispatch(`Sector ${level} expedition initiated. Pilot ${this.pilotCallsign}, descend to search depth.`);

    this.apiService.startRun().subscribe({
      error: () => (this.apiError = 'Could not start a verified dive. Please log in again.')
    });
  }

  switchLevel(level: 1 | 2 | 3): void {
    this.gameEngine.setLevel(level);
  }

  togglePause(): void {
    if (this.activeChestId || this.currentPuzzle || this.isChestCountdown) return;
    this.gameEngine.togglePause();
    this.updateBackgroundAnimationState(this.gameState.isPaused);
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
  /**
   * 2-Phase Sonar Challenge (Memory + Quick Answer)
   * With 3-2-1 Sonar Decryption Countdown & Safe Predator Immunity
   */
  openChestPuzzle(chestId: number): void {
    if (this.puzzleLoading || this.currentPuzzle || this.isChestCountdown) return;
    this.activeChestId = chestId;
    this.isChestCountdown = true;
    this.chestCountdownTimer = 3;
    this.pendingPuzzleData = null;
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

    // Audio cue on countdown start
    this.soundService.playAlertPing();

    this.apiService.newPuzzle().subscribe({
      next: (puzzle) => {
        this.pendingPuzzleData = puzzle;
        this.puzzleLoading = false;
        // If countdown has already elapsed, activate puzzle immediately
        if (!this.isChestCountdown && this.activeChestId) {
          this.activateFishPuzzle(puzzle);
        }
      },
      error: (err) => {
        this.puzzleLoading = false;
        this.isChestCountdown = false;
        this.activeChestId = null;
        if (this.chestCountdownInterval) {
          clearInterval(this.chestCountdownInterval);
          this.chestCountdownInterval = null;
        }
        this.gameEngine.setPuzzlePause(false); // Resume if load fails
        this.apiError = err?.error?.error || 'The sonar is offline. Try the chest again in a moment.';
        setTimeout(() => (this.apiError = ''), 4000);
      }
    });

    // 3 -> 2 -> 1 animated countdown
    if (this.chestCountdownInterval) clearInterval(this.chestCountdownInterval);
    this.chestCountdownInterval = setInterval(() => {
      this.chestCountdownTimer--;
      if (this.chestCountdownTimer > 0) {
        this.soundService.playAlertPing();
      } else {
        clearInterval(this.chestCountdownInterval);
        this.chestCountdownInterval = null;
        this.isChestCountdown = false;
        if (this.pendingPuzzleData) {
          this.activateFishPuzzle(this.pendingPuzzleData);
        }
      }
    }, 1000);
  }

  private activateFishPuzzle(puzzle: PuzzleChallenge): void {
    this.currentPuzzle = puzzle;
    this.puzzleLoading = false;
    this.puzzleOptions = puzzle.options && puzzle.options.length === 3 ? puzzle.options : [3, 5, 7];
    this.bus.emit({ type: 'PuzzleLoaded' });
    this.soundService.speakNavalDispatch('Sonar locked. Count the fish.');
    this.startMemorizePhase();
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
          this.soundService.speakNavalDispatch(`Cipher decrypted! Plus ${r.points} points.`);
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

            // Record cleared level in backend SQLite database (Virtual Identity persistence)
            this.apiService.saveProgress(currentLevel).subscribe({
              next: (res) => {
                localStorage.setItem('ocean_quest_highest_level_cleared', String(res.highestLevel));
              },
              error: (err) => {
                console.warn('Failed to save progression to server:', err);
              }
            });

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
          this.soundService.speakNavalDispatch('Incorrect count. Diver life point lost.', true);
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
    if (this.chestCountdownInterval) {
      clearInterval(this.chestCountdownInterval);
      this.chestCountdownInterval = null;
    }
    this.isChestCountdown = false;
    this.pendingPuzzleData = null;
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
    this.updateBackgroundAnimationState(false);
    this.gameEngine.stopGame();
    this.router.navigate(['/levels']);
  }

  private handleVictory(): void {
    this.gameEngine.stopGame();
    this.soundService.stopBgm();
    this.updateBackgroundAnimationState(true);
    if (this.timerInterval) clearInterval(this.timerInterval);
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
    this.gameEngine.stopGame();
    this.soundService.stopBgm();
    this.updateBackgroundAnimationState(true);
    if (this.timerInterval) clearInterval(this.timerInterval);
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
    const currentRuns = parseInt(localStorage.getItem('oq_total_runs') || '0', 10) + 1;
    localStorage.setItem('oq_total_runs', String(currentRuns));

    const currentScore = this.gameState.score;
    const currentLvl = this.gameState.level;
    const lvlKey = `ocean_quest_level${currentLvl}_best`;
    const oldLvlBest = parseInt(localStorage.getItem(lvlKey) || '0', 10);
    if (currentScore > oldLvlBest) {
      localStorage.setItem(lvlKey, String(currentScore));
    }

    const exploration = Math.max(0, this.gameState.score - this.gameState.chestsCollected * 250);
    this.apiService.saveScore({
      level: currentLvl,
      depthReached: this.gameState.depth,
      explorationScore: exploration
    }).subscribe({
      next: () => console.log('Score synced with global naval fleet.'),
      error: (err) => console.error('Score sync failed:', err)
    });
  }

  updateBackgroundAnimationState(pause: boolean): void {
    const iframe = document.querySelector('.bg-scene-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: pause ? 'PAUSE' : 'RESUME' }, '*');
      }
      try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
          if (pause) iframe.contentDocument.body.classList.add('paused');
          else iframe.contentDocument.body.classList.remove('paused');
        }
      } catch (e) {}
    }
  }

  goToMainMenu(): void {
    this.closeAllModals();
    this.closePuzzle();
    this.updateBackgroundAnimationState(false);
    this.gameEngine.stopGame();
    this.router.navigate(['/']);
  }

  goToLeaderboard(): void {
    this.closeAllModals();
    this.closePuzzle();
    this.updateBackgroundAnimationState(false);
    this.gameEngine.stopGame();
    this.router.navigate(['/leaderboard']);
  }
}





