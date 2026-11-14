/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures * Core application architecture and component implementation.
 */
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameEventBus } from './event-bus.service';
import { MarineService } from './marine.service';

export interface DiverState {
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  vx: number;
  vy: number;
  pitch: number; // Swimming tilt angle (-12 to +12 deg)
  bobOffset: number; // Natural water buoyancy oscillation
  facing: 'left' | 'right';
  state: 'swim' | 'idle' | 'scared' | 'hurt' | 'celebrate' | 'defeated';
  frame: number; // 0 to 3 for swim
  invulnerableTime: number;
}

export interface SharkEntity {
  id: number;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  vx: number;
  vy: number;
  patrolY: number;
  isChasing: boolean;
  detectionRadius: number; // Visible alert ring radius in %
  facing: 'left' | 'right';
  state: 'swim' | 'bite' | 'defeated';
  frame: number; // 0 to 3
  biteTimer: number;
  attackCooldown: number;
}

export interface PirateEntity {
  id: number;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  vx: number;
  vy: number;
  patrolY: number;
  isChasing: boolean;
  detectionRadius: number; // Visible alert ring radius in %
  facing: 'left' | 'right';
  state: 'swim' | 'attack' | 'defeated';
  frame: number; // 0 to 3
  attackFrame: number; // 1 to 3
  attackTimer: number;
  attackCooldown: number;
}

export interface OctopusEntity {
  id: number;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  vx: number;
  vy: number;
  patrolX: number;
  patrolY: number;
  isChasing: boolean;
  detectionRadius: number; // Visible alert ring radius in %
  facing: 'left' | 'right';
  state: 'swim' | 'attack' | 'defeated';
  frame: number;
  attackTimer: number;
  attackCooldown: number;
}

export interface GuardEntity {
  id: number;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  vx: number;
  vy: number;
  patrolX: number;
  patrolY: number;
  isChasing: boolean;
  detectionRadius: number; // Visible alert ring radius in %
  facing: 'left' | 'right';
  state: 'swim' | 'attack' | 'defeated';
  frame: number;
  attackTimer: number;
  attackCooldown: number;
}

export interface OxygenBubbleEntity {
  id: number;
  x: number;
  y: number;
  vy: number;
  size: number;
  popped: boolean;
}

export interface ChestEntity {
  id: number;
  x: number;
  y: number;
  baseY?: number;
  floatOffset?: number;
  opened: boolean;
  nearPlayer: boolean;
}

export interface SafeZoneEntity {
  id: number;
  x: number;
  y: number;
  radius: number; // Safe sanctuary perimeter
  name: string;
}

export interface PowerupEntity {
  id: number;
  x: number;
  y: number;
  type: 'nitro' | 'shield';
  collected: boolean;
  bobOffset?: number;
}


export interface TrailBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface GameState {
  lives: number; // 3, 2, 1, 0 (matching ❤️❤️❤️)
  health: number;
  maxHealth: number;
  oxygen: number;
  depth: number;
  score: number;
  chestsCollected: number;
  level: 1 | 2 | 3; // 1 = Easy (Shark Waters), 2 = Medium (Pirate Cove), 3 = Hard (Abyss Trench)
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isDiverInSafeZone: boolean;
  screenShake: boolean;
  diver: DiverState;
  sharks: SharkEntity[];
  pirates: PirateEntity[];
  octopuses: OctopusEntity[];
  guards: GuardEntity[];
  bubbles: OxygenBubbleEntity[];
  chests: ChestEntity[];
  safeZones: SafeZoneEntity[];
  powerups: PowerupEntity[];
  shieldTimeRemaining: number;
  nitroTimeRemaining: number;
  trailBubbles: TrailBubble[];
}

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  private initialState: GameState = {
    lives: 3,
    health: 100,
    maxHealth: 100,
    oxygen: 100,
    depth: 10,
    score: 0,
    chestsCollected: 0,
    level: 1,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isDiverInSafeZone: false,
    screenShake: false,
    diver: {
      x: 35,
      y: 35,
      vx: 0,
      vy: 0,
      pitch: 0,
      bobOffset: 0,
      facing: 'right',
      state: 'idle',
      frame: 0,
      invulnerableTime: 0
    },
    sharks: [],
    pirates: [],
    octopuses: [],
    guards: [],
    bubbles: [],
    chests: [],
    safeZones: [],
    powerups: [],
    shieldTimeRemaining: 0,
    nitroTimeRemaining: 0,
    trailBubbles: []
  };

  private stateSubject = new BehaviorSubject<GameState>(this.initialState);
  public state$: Observable<GameState> = this.stateSubject.asObservable();

  // Active key map for smooth input
  private keys: { [key: string]: boolean } = {};
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private animTimer: number = 0;
  private oxygenTimer: number = 0;
  private depthDescentTimer: number = 0;
  private bubbleSpawnTimer: number = 0;
  private shakeTimer: number = 0;
  private trailTimer: number = 0;
  private totalGameTime: number = 0;
  private nextEntityId: number = 1;

  constructor(
    private ngZone: NgZone,
    private bus: GameEventBus,
    private marineService: MarineService
  ) {}

  get currentState(): GameState {
    return this.stateSubject.value;
  }

  startGame(level: 1 | 2 | 3 = 1): void {
    this.stopGameLoop();

    const initialDiver: DiverState = {
      x: 35,
      y: 35,
      vx: 0,
      vy: 0,
      pitch: 0,
      bobOffset: 0,
      facing: 'right',
      state: 'swim',
      frame: 0,
      invulnerableTime: 3.0  // 3s spawn-grace: enemies cannot attack immediately
    };

    const initialDepth = level === 1 ? 25 : (level === 2 ? 140 : 280);
    const chests = this.createChestsForLevel(level);
    const newState: GameState = {
      ...this.initialState,
      lives: 3,
      health: 100,
      oxygen: 100,
      level,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      isDiverInSafeZone: false,
      diver: initialDiver,
      depth: initialDepth,
      sharks: this.createSharksForLevel(level),
      pirates: this.createPiratesForLevel(level),
      octopuses: this.createOctopusesForLevel(level, chests),
      guards: this.createGuardsForLevel(level, chests),
      bubbles: this.createInitialBubbles(),
      chests,
      safeZones: this.createSafeZonesForLevel(level),
      powerups: this.createPowerupsForLevel(level),
      shieldTimeRemaining: 0,
      nitroTimeRemaining: 0,
      trailBubbles: []
    };

    this.stateSubject.next(newState);
    this.lastTime = performance.now();
    this.totalGameTime = 0;

    // Run game physics loop outside NgZone for 60fps performance
    this.ngZone.runOutsideAngular(() => {
      this.loop(performance.now());
    });
  }

  setLevel(level: 1 | 2 | 3): void {
    const depth = level === 1 ? 25 : (level === 2 ? 140 : 280);
    if (!this.currentState.isPlaying) {
      this.stateSubject.next({
        ...this.currentState,
        level,
        depth
      });
      return;
    }

    const chests = this.createChestsForLevel(level);
    this.stateSubject.next({
      ...this.currentState,
      level,
      depth,
      sharks: this.createSharksForLevel(level),
      pirates: this.createPiratesForLevel(level),
      octopuses: this.createOctopusesForLevel(level, chests),
      guards: this.createGuardsForLevel(level, chests),
      safeZones: this.createSafeZonesForLevel(level),
        powerups: this.createPowerupsForLevel(level),
        shieldTimeRemaining: 0,
        nitroTimeRemaining: 0,
        chests
      });
    this.bus.emit({ type: 'LevelChanged', level });
  }

  setPuzzlePause(paused: boolean): void {
    if (!this.currentState.isPlaying || this.currentState.isGameOver) return;
    this.updateState({ isPaused: paused });
    if (!paused) {
      this.lastTime = performance.now();
      this.ngZone.runOutsideAngular(() => {
        this.loop(performance.now());
      });
    }
  }

  togglePause(): void {
    if (!this.currentState.isPlaying || this.currentState.isGameOver) return;
    const isPaused = !this.currentState.isPaused;
    this.updateState({ isPaused });
    if (!isPaused) {
      this.lastTime = performance.now();
      this.ngZone.runOutsideAngular(() => {
        this.loop(performance.now());
      });
    }
  }

  stopGame(): void {
    this.stopGameLoop();
    this.updateState({ isPlaying: false, isPaused: true });
  }

  handleKeyDown(key: string): void {
    const k = key.toLowerCase();
    this.keys[k] = true;
    if (k.startsWith('arrow')) {
      this.keys[key] = true;
    }
  }

  handleKeyUp(key: string): void {
    const k = key.toLowerCase();
    this.keys[k] = false;
    if (k.startsWith('arrow')) {
      this.keys[key] = false;
    }
  }

  moveDiverTowards(targetXPercent: number, targetYPercent: number): void {
    if (!this.currentState.isPlaying || this.currentState.isPaused || this.currentState.isGameOver) return;
    const diver = this.currentState.diver;
    const dx = targetXPercent - diver.x;
    const dy = targetYPercent - diver.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 2) {
      const speed = 0.85;
      diver.vx = (dx / dist) * speed;
      diver.vy = (dy / dist) * speed;
      if (dx > 0) diver.facing = 'right';
      else if (dx < 0) diver.facing = 'left';
    }
  }

  setSprint(active: boolean): void {
    this.keys['shift'] = active;
  }

  /**
   * Internal predator attack resolution with real physics knockback and invulnerability
   */
  applyPredatorDamage(
    state: GameState,
    diver: DiverState,
    attackerX: number,
    attackerY: number,
    reason: 'shark' | 'pirate' | 'octopus' | 'guard'
  ): void {
    if (diver.invulnerableTime > 0 || state.isGameOver || state.isPaused || !state.isPlaying) return;

    state.lives = Math.max(0, state.lives - 1);
    state.health = Math.round((state.lives / 3) * 100);
    state.screenShake = true;
    this.shakeTimer = 0.45;

    // Direct knockback impulse away from attacker
    const dx = diver.x - attackerX;
    const dy = diver.y - attackerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    diver.vx = nx * 2.4;
    diver.vy = ny * 2.4;
    diver.x = Math.max(6, Math.min(90, diver.x + nx * 8));
    diver.y = Math.max(6, Math.min(84, diver.y + ny * 6));
    diver.state = 'hurt';
    diver.invulnerableTime = 2.0; // 2 seconds invulnerability

    this.bus.emit({ type: 'DiverHurt', amount: 33 });

    if (state.lives <= 0) {
      this.triggerGameOver();
      return;
    }
  }

  /**
   * Unified 3-Life Damage System
   * Decrements 1 heart (life point), updates health bar, applies invulnerability flicker and shake.
   */
  takeLifeDamage(reason: 'shark' | 'pirate' | 'octopus' | 'guard' | 'oxygen' | 'puzzle' = 'shark'): void {
    const state = this.currentState;
    if (state.diver.invulnerableTime > 0 || state.isGameOver) return;
    if (reason !== 'puzzle' && (state.isPaused || !state.isPlaying)) return;

    const newLives = Math.max(0, state.lives - 1);
    const newHealth = Math.round((newLives / 3) * 100);

    this.bus.emit({ type: 'DiverHurt', amount: 33 });

    // Knockback push away from danger
    const pushDir = state.diver.facing === 'right' ? -4 : 4;

    this.updateState({
      lives: newLives,
      health: newHealth,
      screenShake: true,
      diver: {
        ...state.diver,
        x: Math.max(6, Math.min(90, state.diver.x + pushDir)),
        state: 'hurt',
        invulnerableTime: 2.0 // 2s invulnerability
      }
    });

    this.shakeTimer = 0.45;

    if (newLives <= 0) {
      this.triggerGameOver();
      return;
    }
  }

  takeDamage(amount: number): void {
    // Legacy support: maps damage directly to life deduction
    this.takeLifeDamage();
  }

  addScore(points: number): void {
    const state = this.currentState;
    this.updateState({
      score: state.score + points
    });
  }

  collectChest(points: number): void {
    const state = this.currentState;
    this.bus.emit({ type: 'ChestUnlocked', points });
    this.updateState({
      score: state.score + points,
      chestsCollected: state.chestsCollected + 1,
      oxygen: Math.min(100, state.oxygen + 25),
      diver: {
        ...state.diver,
        state: 'celebrate'
      }
    });

    // Reset celebrate state after 2 seconds
    setTimeout(() => {
      if (this.currentState.isPlaying && !this.currentState.isGameOver) {
        this.updateState({
          diver: {
            ...this.currentState.diver,
            state: 'swim'
          }
        });
      }
    }, 2000);
  }

  addOxygen(amount: number): void {
    const newOxygen = Math.min(100, this.currentState.oxygen + amount);
    this.bus.emit({ type: 'BubbleCollected' });
    this.updateState({ oxygen: newOxygen });
  }

  private loop(now: number): void {
    if (!this.currentState.isPlaying || this.currentState.isPaused || this.currentState.isGameOver) {
      return;
    }

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.updatePhysicsAndLogic(dt);

    if (this.currentState.isPlaying && !this.currentState.isPaused && !this.currentState.isGameOver) {
      this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private updatePhysicsAndLogic(dt: number): void {
    if (this.currentState.isGameOver || this.currentState.isPaused || !this.currentState.isPlaying) return;
    const state = { ...this.currentState };
    const diver = { ...state.diver };
    this.totalGameTime += dt;

    // 1. Process Input for Diver
    let ax = 0;
    let ay = 0;
    const isSprinting = !!(this.keys['shift']);
    const accel = isSprinting ? 3.4 : 1.8;

    if (this.keys['arrowup'] || this.keys['w']) ay -= accel;
    if (this.keys['arrowdown'] || this.keys['s']) ay += accel;
    if (this.keys['arrowleft'] || this.keys['a']) {
      ax -= accel;
      diver.facing = 'left';
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      ax += accel;
      diver.facing = 'right';
    }

    diver.vx += ax * dt;
    diver.vy += ay * dt;

    // Smooth water drag / glide (natural underwater coasting!)
    const drag = isSprinting ? 0.96 : 0.945;
    diver.vx *= drag;
    diver.vy *= drag;

    // Smooth swimming pitch tilt (-12deg up, +12deg down)
    const targetPitch = ay < 0 
      ? (diver.facing === 'right' ? -12 : 12) 
      : (ay > 0 ? (diver.facing === 'right' ? 12 : -12) : 0);
    diver.pitch += (targetPitch - diver.pitch) * 8 * dt;

    // Natural idle buoyancy float when stopped (subtle water oscillation)
    const speed = Math.sqrt(diver.vx * diver.vx + diver.vy * diver.vy);
    if (speed < 0.08) {
      diver.bobOffset = Math.sin(this.totalGameTime * 2.2) * 0.4;
    } else {
      diver.bobOffset = 0;
    }

    const nitroMult = state.nitroTimeRemaining > 0 ? 1.6 : 1.0;
    // Update position
    diver.x += diver.vx * 32 * dt * nitroMult;
    diver.y += (diver.vy * 26 * nitroMult + diver.bobOffset * 0.3) * dt;

    
    // Power-up duration timers
    if (state.shieldTimeRemaining > 0) {
      state.shieldTimeRemaining = Math.max(0, state.shieldTimeRemaining - dt);
    }
    if (state.nitroTimeRemaining > 0) {
      state.nitroTimeRemaining = Math.max(0, state.nitroTimeRemaining - dt);
    }

    // Power-up pickups collision check
    state.powerups.forEach((pu) => {
      if (!pu.collected) {
        pu.bobOffset = Math.sin(this.totalGameTime * 3.5 + pu.id) * 1.5;
        const dx = diver.x - pu.x;
        const dy = diver.y - (pu.y + (pu.bobOffset || 0));
        const dist = Math.hypot(dx, dy);
        if (dist <= 5.5) {
          pu.collected = true;
          if (pu.type === 'nitro') {
            state.nitroTimeRemaining = 7;
          } else if (pu.type === 'shield') {
            state.shieldTimeRemaining = 8;
          }
          this.bus.emit({ type: 'PowerupCollected', powerupType: pu.type });
        }
      }
    });

    // Viewport clamping
    diver.x = Math.max(5, Math.min(91, diver.x));
    diver.y = Math.max(6, Math.min(84, diver.y));

    // Handle invulnerability countdown
    if (diver.invulnerableTime > 0) {
      diver.invulnerableTime = Math.max(0, diver.invulnerableTime - dt);
    }

    // Handle screen shake timer
    if (state.screenShake) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        state.screenShake = false;
      }
    }

    // Handle oxygen depletion (Danger Zone filling)
    this.oxygenTimer += dt;
    if (this.oxygenTimer >= 1.0) {
      this.oxygenTimer = 0;
      const climateMod = this.marineService?.getOxygenDrainModifier() || 1.0;
      const levelDrainMod = state.level === 3 ? 1.25 : (state.level === 2 ? 1.15 : 1.0);
      const drainRate = (0.75 + (diver.y / 100) * 0.35) * climateMod * levelDrainMod;
      const newOxygen = Math.max(0, state.oxygen - drainRate);
      state.oxygen = Math.round(newOxygen * 10) / 10;

      // When Danger Zone fills completely (Oxygen reaches 0):
      if (state.oxygen <= 0 && diver.invulnerableTime <= 0) {
        this.takeLifeDamage('oxygen');
        // Emergency air recovery buffer so player has a fighting chance
        state.oxygen = 35;
        this.spawnEmergencyBubbles(diver.x, diver.y);
      }
    }

    // Depth tracking
    this.depthDescentTimer += dt;
    if (this.depthDescentTimer >= 0.5) {
      this.depthDescentTimer = 0;
      const depthOffset = Math.floor((diver.y / 100) * 80);
      const levelBase = state.level === 1 ? 20 : (state.level === 2 ? 150 : 280);
      state.depth = Math.max(state.depth, levelBase + depthOffset);
      state.score += 1;
    }

    // Diver animation frames (swim cycle 0..3)
    this.animTimer += dt;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      diver.frame = (diver.frame + 1) % 4;
      this.updateEnemyFrames();
    }

    // Bubble trail from scuba diver
    this.trailTimer += dt;
    if (this.trailTimer >= 0.35 && (Math.abs(diver.vx) > 0.1 || Math.abs(diver.vy) > 0.1)) {
      this.trailTimer = 0;
      this.spawnTrailBubble(diver.x, diver.y);
    }

    // Check if diver is inside any safe sanctuary zone or near chest to open it
    const isDiverInSafeZone = state.safeZones.some(
      (sz) => Math.hypot(diver.x - sz.x, diver.y - sz.y) <= sz.radius
    );
    // When diver reaches mystery box to open it, predators cannot attack!
    const isNearBox = state.chests.some(
      (c) => !c.opened && Math.hypot(diver.x - c.x, diver.y - c.y) <= 14
    );
    const isDiverProtected = isDiverInSafeZone || isNearBox || state.isPaused || state.shieldTimeRemaining > 0;
    state.isDiverInSafeZone = isDiverInSafeZone;

    // 2. Predator Encounters (Visible Detection Radius, Safe Sanctuary & Box Immunity)
    let isDiverScared = false;

    // Level 1: Sharks Guard, Patrol & Attack
    const updatedSharks = state.sharks.map((shark) => {
      const s = { ...shark };
      const dx = diver.x - s.x;
      const dy = diver.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Decrement attack cooldown
      if (s.attackCooldown > 0) {
        s.attackCooldown = Math.max(0, s.attackCooldown - dt);
      }

      // Check if diver is inside visible detection radius (and NOT protected by safe zone or near box)
      const detectionDist = s.detectionRadius || 26;
      const shouldChase = !isDiverProtected && !state.isPaused && dist <= detectionDist && s.attackCooldown <= 0;

      // Shark bite attack strike range: aspect-corrected contact distance (5.5%)
      const strikeDist = Math.hypot(dx, dy * 1.5);
      if (strikeDist <= 5.5 && !isDiverProtected && !state.isPaused && diver.invulnerableTime <= 0 && s.attackCooldown <= 0 && !state.isGameOver) {
        s.state = 'bite';
        s.biteTimer = 0.8;
        s.attackCooldown = 2.5; // 2.5s recovery before next strike
        this.bus.emit({ type: 'SharkBite' });
        
        // Direct local life-point damage & vector knockback
        this.applyPredatorDamage(state, diver, s.x, s.y, 'shark');

        // Attacker recoil impulse
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        s.vx = -nx * 1.5;
        s.vy = -ny * 1.5;
      }

      // Physical separation: prevents sprites from deeply overlapping
      const minSep = 4.0;
      if (dist < minSep && dist > 0.001) {
        const overlap = minSep - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        diver.x = Math.max(5, Math.min(91, diver.x + nx * overlap * 0.5));
        diver.y = Math.max(6, Math.min(84, diver.y + ny * overlap * 0.5));
        s.x = Math.max(5, Math.min(92, s.x - nx * overlap * 0.5));
        s.y = Math.max(6, Math.min(84, s.y - ny * overlap * 0.5));
      }

      if (s.attackCooldown > 0) {
        // Recoil / circle back during cooldown (gives player room to breathe and maneuver)
        s.isChasing = false;
        const retreatAngle = Math.atan2(-dy, -dx) + 0.4;
        s.vx = Math.cos(retreatAngle) * 1.1;
        s.vy = Math.sin(retreatAngle) * 0.7;
        s.facing = s.vx >= 0 ? 'right' : 'left';
        s.x += s.vx * dt * 14;
        s.y += s.vy * dt * 11;
      } else if (shouldChase && !state.isGameOver) {
        s.isChasing = true;
        if (dist < 18) isDiverScared = true;
        // Aggressive steering towards diver
        const chaseSpeed = 1.35;
        const angle = Math.atan2(dy, dx);
        s.vx = Math.cos(angle) * chaseSpeed;
        s.vy = Math.sin(angle) * chaseSpeed;
        s.facing = s.vx >= 0 ? 'right' : 'left';
        s.x += s.vx * dt * 16;
        s.y += s.vy * dt * 14;
      } else {
        s.isChasing = false;
        // Normal peaceful patrol when outside detection zone or diver is in safe sanctuary
        s.x += s.vx * dt * 14;
        s.y += (s.patrolY - s.y) * 2 * dt;
        if (s.x > 88) {
          s.vx = -Math.abs(s.vx);
          s.facing = 'left';
        } else if (s.x < 8) {
          s.vx = Math.abs(s.vx);
          s.facing = 'right';
        }
      }

      if (s.state === 'bite') {
        s.biteTimer -= dt;
        if (s.biteTimer <= 0) s.state = 'swim';
      }

      return s;
    });

    // Level 2: Pirates Guard, Patrol & Attack
    const updatedPirates = state.pirates.map((pirate) => {
      const p = { ...pirate };
      const dx = diver.x - p.x;
      const dy = diver.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (p.attackCooldown > 0) {
        p.attackCooldown = Math.max(0, p.attackCooldown - dt);
      }

      // Check if diver is inside visible detection radius (and NOT protected by safe zone or near box)
      const detectionDist = p.detectionRadius || 26;
      const shouldChase = !isDiverProtected && !state.isPaused && dist <= detectionDist && p.attackCooldown <= 0;

      // Pirate sword slash attack strike range: tight true distance (4.2%) — no corner false positives
      const strikeDist = Math.hypot(dx, dy);
      if (strikeDist <= 4.2 && !isDiverProtected && !state.isPaused && diver.invulnerableTime <= 0 && p.attackCooldown <= 0 && !state.isGameOver) {
        p.state = 'attack';
        p.attackTimer = 0.9;
        p.attackFrame = 2;
        p.attackCooldown = 2.5;
        this.bus.emit({ type: 'SwordSlash' });

        // Direct local life-point damage & vector knockback
        this.applyPredatorDamage(state, diver, p.x, p.y, 'pirate');

        // Attacker recoil impulse
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        p.vx = -nx * 1.5;
        p.vy = -ny * 1.5;
      }

      // Physical separation: prevents sprites from deeply overlapping
      const minSep = 4.0;
      if (dist < minSep && dist > 0.001) {
        const overlap = minSep - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        diver.x = Math.max(5, Math.min(91, diver.x + nx * overlap * 0.5));
        diver.y = Math.max(6, Math.min(84, diver.y + ny * overlap * 0.5));
        p.x = Math.max(5, Math.min(92, p.x - nx * overlap * 0.5));
        p.y = Math.max(6, Math.min(84, p.y - ny * overlap * 0.5));
      }

      if (p.attackCooldown > 0) {
        // Recoil / circle back during cooldown
        p.isChasing = false;
        const retreatAngle = Math.atan2(-dy, -dx) + 0.4;
        p.vx = Math.cos(retreatAngle) * 1.1;
        p.vy = Math.sin(retreatAngle) * 0.7;
        p.facing = p.vx >= 0 ? 'right' : 'left';
        p.x += p.vx * dt * 14;
        p.y += p.vy * dt * 11;
      } else if (shouldChase && !state.isGameOver) {
        p.isChasing = true;
        if (dist < 18) isDiverScared = true;
        const chaseSpeed = 1.3;
        const angle = Math.atan2(dy, dx);
        p.vx = Math.cos(angle) * chaseSpeed;
        p.vy = Math.sin(angle) * chaseSpeed;
        p.facing = p.vx >= 0 ? 'right' : 'left';
        p.x += p.vx * dt * 15;
        p.y += p.vy * dt * 13;
      } else {
        p.isChasing = false;
        p.x += p.vx * dt * 12;
        p.y += (p.patrolY - p.y) * 2 * dt;
        if (p.x > 86) {
          p.vx = -Math.abs(p.vx);
          p.facing = 'left';
        } else if (p.x < 10) {
          p.vx = Math.abs(p.vx);
          p.facing = 'right';
        }
      }

      if (p.state === 'attack') {
        p.attackTimer -= dt;
        if (p.attackTimer <= 0) p.state = 'swim';
      }

      return p;
    });

    // Level 3: Octopus Guards & Attacks (Protects Mystery Box)
    const updatedOctopuses = state.octopuses.map((octopus) => {
      const o = { ...octopus };
      const dx = diver.x - o.x;
      const dy = diver.y - o.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (o.attackCooldown > 0) {
        o.attackCooldown = Math.max(0, o.attackCooldown - dt);
      }

      const detectionDist = o.detectionRadius || 28;
      const shouldChase = !isDiverProtected && !state.isPaused && dist <= detectionDist && o.attackCooldown <= 0;

      // Octopus tentacle strike attack range: aspect-corrected contact distance (6.0%)
      const strikeDist = Math.hypot(dx, dy * 1.5);
      if (strikeDist <= 6.0 && !isDiverProtected && !state.isPaused && diver.invulnerableTime <= 0 && o.attackCooldown <= 0 && !state.isGameOver) {
        o.state = 'attack';
        o.attackTimer = 0.9;
        o.attackCooldown = 2.4;
        this.bus.emit({ type: 'OctopusAttack' });
        this.applyPredatorDamage(state, diver, o.x, o.y, 'octopus');

        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        o.vx = -nx * 1.5;
        o.vy = -ny * 1.5;
      }

      // Physical separation
      const minSep = 4.0;
      if (dist < minSep && dist > 0.001) {
        const overlap = minSep - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        diver.x = Math.max(5, Math.min(91, diver.x + nx * overlap * 0.5));
        diver.y = Math.max(6, Math.min(84, diver.y + ny * overlap * 0.5));
        o.x = Math.max(5, Math.min(92, o.x - nx * overlap * 0.5));
        o.y = Math.max(6, Math.min(84, o.y - ny * overlap * 0.5));
      }

      if (o.attackCooldown > 0) {
        o.isChasing = false;
        const retreatAngle = Math.atan2(-dy, -dx) + 0.4;
        o.vx = Math.cos(retreatAngle) * 1.0;
        o.vy = Math.sin(retreatAngle) * 0.6;
        o.facing = o.vx >= 0 ? 'right' : 'left';
        o.x += o.vx * dt * 13;
        o.y += o.vy * dt * 10;
      } else if (shouldChase && !state.isGameOver) {
        o.isChasing = true;
        if (dist < 18) isDiverScared = true;
        const chaseSpeed = 1.35;
        const angle = Math.atan2(dy, dx);
        o.vx = Math.cos(angle) * chaseSpeed;
        o.vy = Math.sin(angle) * chaseSpeed;
        o.facing = o.vx >= 0 ? 'right' : 'left';
        o.x += o.vx * dt * 15;
        o.y += o.vy * dt * 13;
      } else {
        o.isChasing = false;
        o.x += o.vx * dt * 11;
        o.y += (o.patrolY - o.y) * 2 * dt;
        const minX = Math.max(8, o.patrolX - 16);
        const maxX = Math.min(90, o.patrolX + 16);
        if (o.x > maxX) {
          o.vx = -Math.abs(o.vx);
          o.facing = 'left';
        } else if (o.x < minX) {
          o.vx = Math.abs(o.vx);
          o.facing = 'right';
        }
      }

      if (o.state === 'attack') {
        o.attackTimer -= dt;
        if (o.attackTimer <= 0) o.state = 'swim';
      }

      return o;
    });

    // Level 3: Guard Patrols & Attacks (Protects Mystery Box)
    const updatedGuards = state.guards.map((guard) => {
      const g = { ...guard };
      const dx = diver.x - g.x;
      const dy = diver.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (g.attackCooldown > 0) {
        g.attackCooldown = Math.max(0, g.attackCooldown - dt);
      }

      const detectionDist = g.detectionRadius || 26;
      const shouldChase = !isDiverProtected && !state.isPaused && dist <= detectionDist && g.attackCooldown <= 0;

      // Guard attack range: aspect-corrected contact distance (5.8%)
      const strikeDist = Math.hypot(dx, dy * 1.5);
      if (strikeDist <= 5.8 && !isDiverProtected && !state.isPaused && diver.invulnerableTime <= 0 && g.attackCooldown <= 0 && !state.isGameOver) {
        g.state = 'attack';
        g.attackTimer = 0.9;
        g.attackCooldown = 2.4;
        this.bus.emit({ type: 'GuardAttack' });
        this.applyPredatorDamage(state, diver, g.x, g.y, 'guard');

        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        g.vx = -nx * 1.5;
        g.vy = -ny * 1.5;
      }

      const minSep = 4.0;
      if (dist < minSep && dist > 0.001) {
        const overlap = minSep - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        diver.x = Math.max(5, Math.min(91, diver.x + nx * overlap * 0.5));
        diver.y = Math.max(6, Math.min(84, diver.y + ny * overlap * 0.5));
        g.x = Math.max(5, Math.min(92, g.x - nx * overlap * 0.5));
        g.y = Math.max(6, Math.min(84, g.y - ny * overlap * 0.5));
      }

      if (g.attackCooldown > 0) {
        g.isChasing = false;
        const retreatAngle = Math.atan2(-dy, -dx) + 0.4;
        g.vx = Math.cos(retreatAngle) * 1.1;
        g.vy = Math.sin(retreatAngle) * 0.7;
        g.facing = g.vx >= 0 ? 'right' : 'left';
        g.x += g.vx * dt * 14;
        g.y += g.vy * dt * 11;
      } else if (shouldChase && !state.isGameOver) {
        g.isChasing = true;
        if (dist < 18) isDiverScared = true;
        const chaseSpeed = 1.35;
        const angle = Math.atan2(dy, dx);
        g.vx = Math.cos(angle) * chaseSpeed;
        g.vy = Math.sin(angle) * chaseSpeed;
        g.facing = g.vx >= 0 ? 'right' : 'left';
        g.x += g.vx * dt * 15;
        g.y += g.vy * dt * 13;
      } else {
        g.isChasing = false;
        g.x += g.vx * dt * 12;
        g.y += (g.patrolY - g.y) * 2 * dt;
        const minX = Math.max(8, g.patrolX - 14);
        const maxX = Math.min(90, g.patrolX + 14);
        if (g.x > maxX) {
          g.vx = -Math.abs(g.vx);
          g.facing = 'left';
        } else if (g.x < minX) {
          g.vx = Math.abs(g.vx);
          g.facing = 'right';
        }
      }

      if (g.state === 'attack') {
        g.attackTimer -= dt;
        if (g.attackTimer <= 0) g.state = 'swim';
      }

      return g;
    });

    // Determine diver emotional state
    if (diver.state !== 'hurt' && diver.state !== 'celebrate' && diver.state !== 'defeated') {
      if (isDiverScared) {
        diver.state = 'scared';
      } else if (Math.abs(diver.vx) > 0.05 || Math.abs(diver.vy) > 0.05) {
        diver.state = 'swim';
      } else {
        diver.state = 'idle';
      }
    } else if (diver.state === 'hurt' && diver.invulnerableTime <= 1.0) {
      diver.state = isDiverScared ? 'scared' : 'swim';
    }

    // 3. Oxygen Bubbles updates & collection
    const updatedBubbles: OxygenBubbleEntity[] = [];
    for (const bubble of state.bubbles) {
      const b = { ...bubble };
      b.y -= b.vy * dt * 15;

      const dx = Math.abs(b.x - diver.x);
      const dy = Math.abs(b.y - diver.y);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 6 && !b.popped) {
        b.popped = true;
        this.bus.emit({ type: 'BubbleCollected' });
        state.oxygen = Math.min(100, state.oxygen + 18);
      } else if (b.y > 5 && !b.popped) {
        updatedBubbles.push(b);
      }
    }

    // Spawn new rising bubbles periodically
    this.bubbleSpawnTimer += dt;
    if (this.bubbleSpawnTimer >= 2.5) {
      this.bubbleSpawnTimer = 0;
      if (updatedBubbles.length < 5) {
        updatedBubbles.push({
          id: this.nextEntityId++,
          x: 10 + Math.random() * 80,
          y: 92,
          vy: 0.4 + Math.random() * 0.4,
          size: 28 + Math.random() * 12,
          popped: false
        });
      }
    }

    // 4. Chest Proximity Detection & Oceanic Buoyancy Float
    const updatedChests = state.chests.map((chest) => {
      const baseY = chest.baseY ?? chest.y;
      const floatOffset = (chest.floatOffset ?? 0) + dt * 2.0;
      const floatingY = !chest.opened ? +(baseY + Math.sin(floatOffset) * 1.5).toFixed(2) : baseY;
      const dx = Math.abs(chest.x - diver.x);
      const dy = Math.abs(floatingY - diver.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        ...chest,
        y: floatingY,
        baseY,
        floatOffset,
        nearPlayer: dist < 12
      };
    });

    // 5. Trail Bubbles Physics
    const updatedTrail: TrailBubble[] = [];
    for (const tb of state.trailBubbles) {
      tb.life += dt;
      tb.x += tb.vx * dt * 0.5;
      tb.y += tb.vy * dt * 0.5;
      if (tb.life < tb.maxLife) {
        updatedTrail.push(tb);
      }
    }

    if (this.currentState.isGameOver || !this.currentState.isPlaying) {
      return;
    }

    this.ngZone.run(() => {
      this.stateSubject.next({
        ...state,
        diver,
        sharks: updatedSharks,
        pirates: updatedPirates,
        octopuses: updatedOctopuses,
        guards: updatedGuards,
        bubbles: updatedBubbles,
        chests: updatedChests,
        trailBubbles: updatedTrail
      });
    });
  }

  private updateEnemyFrames(): void {
    const s = this.currentState;
    s.sharks.forEach((shark) => {
      shark.frame = (shark.frame + 1) % 4;
    });
    s.pirates.forEach((pirate) => {
      pirate.frame = (pirate.frame + 1) % 4;
    });
    s.octopuses.forEach((octopus) => {
      octopus.frame = (octopus.frame + 1) % 14;
    });
    s.guards.forEach((guard) => {
      guard.frame = (guard.frame + 1) % 15;
    });
  }

  private spawnTrailBubble(diverX: number, diverY: number): void {
    const newBubble: TrailBubble = {
      id: this.nextEntityId++,
      x: diverX - 2 + Math.random() * 4,
      y: diverY + 2 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 4,
      vy: -12 - Math.random() * 6,
      life: 0,
      maxLife: 1.2
    };
    this.currentState.trailBubbles.push(newBubble);
  }

  private spawnEmergencyBubbles(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      this.currentState.bubbles.push({
        id: this.nextEntityId++,
        x: Math.max(10, Math.min(90, x - 10 + Math.random() * 20)),
        y: Math.max(15, y - 5 + Math.random() * 10),
        vy: 0.6,
        size: 32,
        popped: false
      });
    }
  }

  /**
   * Procedural Entity Generation (University Theme: Low Coupling & Dynamic State Management)
   * Randomizes predator patrol depths, horizontal spawn bounds, swimming speeds, and detection radii.
   */
  private createSharksForLevel(level: number): SharkEntity[] {
    if (level === 1) {
      // Level 1: Easy - 2 Sharks procedurally placed at randomized patrol depths and positions
      const y1 = Math.round(38 + Math.random() * 20); // 38% - 58%
      const y2 = Math.round(60 + Math.random() * 18); // 60% - 78%
      const x1 = Math.round(12 + Math.random() * 22); // 12% - 34%
      const x2 = Math.round(66 + Math.random() * 22); // 66% - 88%
      const speed1 = +(0.8 + Math.random() * 0.4).toFixed(2);
      const speed2 = +(0.85 + Math.random() * 0.4).toFixed(2);

      return [
        {
          id: 1,
          x: x1,
          y: y1,
          vx: speed1,
          vy: 0,
          patrolY: y1,
          isChasing: false,
          detectionRadius: Math.round(18 + Math.random() * 5),
          facing: 'right',
          state: 'swim',
          frame: 0,
          biteTimer: 0,
          attackCooldown: 0
        },
        {
          id: 2,
          x: x2,
          y: y2,
          vx: -speed2,
          vy: 0,
          patrolY: y2,
          isChasing: false,
          detectionRadius: Math.round(20 + Math.random() * 5),
          facing: 'left',
          state: 'swim',
          frame: 1,
          biteTimer: 0,
          attackCooldown: 0
        }
      ];
    } else if (level === 2) {
      // Level 2: Medium - 1 Shark lurking in procedurally determined deep ocean sector
      const y1 = Math.round(62 + Math.random() * 16);
      const x1 = Math.round(15 + Math.random() * 30);
      const speed1 = +(0.75 + Math.random() * 0.35).toFixed(2);
      return [
        {
          id: 1,
          x: x1,
          y: y1,
          vx: speed1,
          vy: 0,
          patrolY: y1,
          isChasing: false,
          detectionRadius: Math.round(22 + Math.random() * 5),
          facing: 'right',
          state: 'swim',
          frame: 0,
          biteTimer: 0,
          attackCooldown: 0
        }
      ];
    } else {
      return [];
    }
  }

  private createPiratesForLevel(level: number): PirateEntity[] {
    if (level === 2) {
      // Level 2: Medium - 2 Pirate Raiders with procedurally randomized patrol depths and speeds
      const y1 = Math.round(38 + Math.random() * 16); // 38% - 54%
      const y2 = Math.round(56 + Math.random() * 18); // 56% - 74%
      const x1 = Math.round(15 + Math.random() * 25);
      const x2 = Math.round(65 + Math.random() * 25);
      const speed1 = +(0.8 + Math.random() * 0.4).toFixed(2);
      const speed2 = +(0.85 + Math.random() * 0.4).toFixed(2);

      return [
        {
          id: 10,
          x: x1,
          y: y1,
          vx: speed1,
          vy: 0,
          patrolY: y1,
          isChasing: false,
          detectionRadius: Math.round(21 + Math.random() * 5),
          facing: 'right',
          state: 'swim',
          frame: 0,
          attackFrame: 1,
          attackTimer: 0,
          attackCooldown: 0
        },
        {
          id: 11,
          x: x2,
          y: y2,
          vx: -speed2,
          vy: 0,
          patrolY: y2,
          isChasing: false,
          detectionRadius: Math.round(23 + Math.random() * 5),
          facing: 'left',
          state: 'swim',
          frame: 2,
          attackFrame: 1,
          attackTimer: 0,
          attackCooldown: 0
        }
      ];
    }
    return [];
  }

  /**
   * Level 3: Giant Abyssal Octopus protecting the Mystery Box at its randomized coordinates
   */
  private createOctopusesForLevel(level: number, chests: ChestEntity[]): OctopusEntity[] {
    if (level !== 3) return [];
    const targetChest = chests && chests[0] ? chests[0] : { x: 50, y: 70 };
    const chestX = targetChest.x;
    const chestY = targetChest.y;
    const octoX = Math.max(15, Math.min(85, chestX + Math.round((Math.random() - 0.5) * 8)));
    const octoY = Math.max(25, chestY - Math.round(12 + Math.random() * 6));

    return [
      {
        id: 301,
        x: octoX,
        y: octoY,
        vx: +(0.85 + Math.random() * 0.3).toFixed(2),
        vy: 0,
        patrolX: octoX,
        patrolY: octoY,
        isChasing: false,
        detectionRadius: Math.round(26 + Math.random() * 4),
        facing: 'right',
        state: 'swim',
        frame: 0,
        attackTimer: 0,
        attackCooldown: 0
      }
    ];
  }

  /**
   * Level 3: Abyssal Elite Guards patrolling around the randomized Mystery Box perimeter
   */
  private createGuardsForLevel(level: number, chests: ChestEntity[]): GuardEntity[] {
    if (level !== 3) return [];
    const targetChest = chests && chests[0] ? chests[0] : { x: 50, y: 70 };
    const chestX = targetChest.x;
    const chestY = targetChest.y;

    const g1X = Math.max(10, chestX - Math.round(14 + Math.random() * 8));
    const g2X = Math.min(90, chestX + Math.round(14 + Math.random() * 8));
    const gY = Math.max(28, chestY - Math.round(4 + Math.random() * 8));

    return [
      {
        id: 401,
        x: g1X,
        y: gY,
        vx: +(1.0 + Math.random() * 0.3).toFixed(2),
        vy: 0,
        patrolX: g1X,
        patrolY: gY,
        isChasing: false,
        detectionRadius: Math.round(24 + Math.random() * 4),
        facing: 'right',
        state: 'swim',
        frame: 0,
        attackTimer: 0,
        attackCooldown: 0
      },
      {
        id: 402,
        x: g2X,
        y: gY,
        vx: -(1.05 + Math.random() * 0.3).toFixed(2),
        vy: 0,
        patrolX: g2X,
        patrolY: gY,
        isChasing: false,
        detectionRadius: Math.round(24 + Math.random() * 4),
        facing: 'left',
        state: 'swim',
        frame: 2,
        attackTimer: 0,
        attackCooldown: 0
      }
    ];
  }

  private createInitialBubbles(): OxygenBubbleEntity[] {
    return [
      {
        id: 100,
        x: Math.round(15 + Math.random() * 30),
        y: Math.round(55 + Math.random() * 25),
        vy: +(0.5 + Math.random() * 0.25).toFixed(2),
        size: Math.round(28 + Math.random() * 8),
        popped: false
      },
      {
        id: 101,
        x: Math.round(55 + Math.random() * 35),
        y: Math.round(60 + Math.random() * 25),
        vy: +(0.45 + Math.random() * 0.2).toFixed(2),
        size: Math.round(26 + Math.random() * 8),
        popped: false
      }
    ];
  }

  
  private createPowerupsForLevel(level: number): PowerupEntity[] {
    if (level === 1) {
      return [
        { id: 701, x: 26, y: 52, type: 'nitro', collected: false, bobOffset: 0 },
        { id: 702, x: 74, y: 44, type: 'shield', collected: false, bobOffset: 1 }
      ];
    } else if (level === 2) {
      return [
        { id: 703, x: 30, y: 40, type: 'shield', collected: false, bobOffset: 0 },
        { id: 704, x: 70, y: 64, type: 'nitro', collected: false, bobOffset: 1 }
      ];
    } else {
      return [
        { id: 705, x: 20, y: 60, type: 'shield', collected: false, bobOffset: 0 },
        { id: 706, x: 80, y: 48, type: 'nitro', collected: false, bobOffset: 1 }
      ];
    }
  }

  private createSafeZonesForLevel(level: number): SafeZoneEntity[] {
    if (level === 1) {
      return [
        {
          id: 501,
          x: 10,
          y: 78,
          radius: 11,
          name: 'Coral Sanctuary'
        }
      ];
    } else if (level === 2) {
      return [
        {
          id: 502,
          x: 90,
          y: 76,
          radius: 11,
          name: 'Kelp Sanctuary'
        }
      ];
    } else {
      return [
        {
          id: 503,
          x: 50,
          y: 80,
          radius: 9,
          name: 'Hydrothermal Haven'
        }
      ];
    }
  }

  /**
   * Spawns mystery treasure box containing the Fish API question at a procedurally randomized location
   * (University Themes: Procedural Generation, Interoperability & Dynamic State Management)
   */
  public createChestsForLevel(level: number): ChestEntity[] {
    // Randomize horizontal X between 18% and 82%, depth Y between 42% and 80%
    const randomX = Math.round(18 + Math.random() * 64);
    const randomY = Math.round(42 + Math.random() * 38);

    return [
      {
        id: this.nextEntityId++,
        x: randomX,
        y: randomY,
        baseY: randomY,
        floatOffset: +(Math.random() * Math.PI * 2).toFixed(2),
        opened: false,
        nearPlayer: false
      }
    ];
  }

  /**
   * Re-randomize mystery chest position after successful decryption or level reset
   */
  public respawnChestAtRandomLocation(): void {
    const s = this.currentState;
    s.chests = this.createChestsForLevel(s.level);
    if (s.level === 3) {
      s.octopuses = this.createOctopusesForLevel(3, s.chests);
      s.guards = this.createGuardsForLevel(3, s.chests);
    }
    this.stateSubject.next({ ...s });
  }

  private triggerGameOver(): void {
    this.stopGameLoop();
    this.updateState({
      isPaused: true,
      isGameOver: true,
      isPlaying: false,
      diver: {
        ...this.currentState.diver,
        state: 'defeated'
      }
    });
    this.bus.emit({ type: 'GameOver', score: this.currentState.score });
  }

  private updateState(partial: Partial<GameState>): void {
    this.stateSubject.next({ ...this.currentState, ...partial });
  }

  private stopGameLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.keys = {};
  }
}



