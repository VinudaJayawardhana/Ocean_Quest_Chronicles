/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: services/achievement.service.ts
 *
 * THEME 2 (EVENT-DRIVEN): Subscribes to GameEventBus to listen for achievements
 * without coupling directly to the GameEngineService.
 * THEME 4 (VIRTUAL IDENTITY): Binds medals and pilot accolades to the diver's dossier.
 */
import { Injectable } from '@angular/core';
import { GameEventBus, GameEvent } from './event-bus.service';
import { AuthService } from './auth.service';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  unlockedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private get storageKey(): string {
    const user = this.authService.getCurrentUser();
    const id = user?.id || user?.username || 'guest';
    return `oq_achievements_${id}`;
  }

  private defaultAchievements: Achievement[] = [
    {
      id: 'first_dive',
      icon: '🌊',
      title: 'Enlisted Pilot',
      desc: 'Completed your first deep-sea dive expedition.',
      unlocked: false
    },
    {
      id: 'cipher_master',
      icon: '🎯',
      title: 'Sonar Cryptographer',
      desc: 'Decrypted a mathematical fish cipher from the UoB Fish Game API.',
      unlocked: false
    },
    {
      id: 'speed_demon',
      icon: '⚡',
      title: 'Nitro Fin Racer',
      desc: 'Collected Nitro Fins and surged through dangerous ocean currents.',
      unlocked: false
    },
    {
      id: 'sonar_shield',
      icon: '🛡️',
      title: 'Aegis Guardian',
      desc: 'Activated the Sonar Bubble Shield to repel marine predators.',
      unlocked: false
    },
    {
      id: 'treasure_hunter',
      icon: '📦',
      title: 'Treasure Hoarder',
      desc: 'Recovered Sunken Mystery Chests in deep uncharted waters.',
      unlocked: false
    },
    {
      id: 'abyss_explorer',
      icon: '⚓',
      title: 'Deep Trench Explorer',
      desc: 'Braved the dark depths beyond 30 meters.',
      unlocked: false
    }
  ];

  constructor(private bus: GameEventBus, private authService: AuthService) {
    this.bus.events$.subscribe((event) => this.onGameEvent(event));
  }

  public getAchievements(): Achievement[] {
    if (typeof localStorage === 'undefined') return this.defaultAchievements;
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return this.defaultAchievements.map((ach) => ({
        ...ach,
        unlocked: !!saved[ach.id],
        unlockedAt: saved[ach.id] || undefined
      }));
    } catch {
      return this.defaultAchievements;
    }
  }

  public unlock(id: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      if (!saved[id]) {
        saved[id] = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(saved));
        const ach = this.defaultAchievements.find((a) => a.id === id);
        if (ach) {
          this.bus.emit({
            type: 'AchievementUnlocked',
            achievementId: id,
            title: ach.title
          });
        }
      }
    } catch {}
  }

  private onGameEvent(event: GameEvent): void {
    switch (event.type) {
      case 'Swim':
        this.unlock('first_dive');
        break;
      case 'AnswerChecked':
        if (event.correct) {
          this.unlock('cipher_master');
        }
        break;
      case 'ChestUnlocked':
        this.unlock('treasure_hunter');
        break;
      case 'PowerupCollected':
        if (event.powerupType === 'nitro') {
          this.unlock('speed_demon');
        } else if (event.powerupType === 'shield') {
          this.unlock('sonar_shield');
        }
        break;
      case 'LevelChanged':
        if (event.level >= 2) {
          this.unlock('abyss_explorer');
        }
        break;
      default:
        break;
    }
  }
}
