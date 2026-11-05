/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md).
 * Level Map UI exactly matching the user's reference game art layout.
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SoundService } from '../../services/sound.service';

export interface LevelNode {
  level: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  threat: string;
  zone: string;
  depth: number;
  engineLevel: 1 | 2 | 3;
}

@Component({
  selector: 'app-level-map',
  templateUrl: './level-map.component.html',
  styleUrls: ['./level-map.component.css']
})
export class LevelMapComponent implements OnInit {
  highestCleared: number = 0;
  selectedLevel: number = 1;
  isLaunchModalOpen: boolean = false;
  pilotCallsign: string = 'DeepDiver_99';

  levelsData: { [key: number]: LevelNode } = {
    1: {
      level: 1,
      name: 'Shark Waters',
      difficulty: 'Easy',
      description: 'Sunlit shallow coral reef with wandering reef sharks. Learn underwater navigation and sonar cipher counting.',
      threat: '🦈 Reef Sharks (Patrolling)',
      zone: 'Coral Sanctuary Haven',
      depth: 25,
      engineLevel: 1
    },
    2: {
      level: 2,
      name: 'Pirate Cove',
      difficulty: 'Medium',
      description: 'Sunken galleon graveyard with aggressive pirate raiders guarding ancient mathematical mysteries.',
      threat: '🏴‍☠️ Pirate Raiders + Lurking Shark',
      zone: 'Ancient Kelp Sanctuary',
      depth: 120,
      engineLevel: 2
    },
    3: {
      level: 3,
      name: 'Abyss Trench (Final)',
      difficulty: 'Hard',
      description: 'The ultimate final showdown! Perilous deep trench waters where giant megalodons and ghost pirate captains guard the legendary treasure.',
      threat: '⚡ Megalodon Predators + Ghost Captains',
      zone: 'Midnight Abyss (FINAL STAGE)',
      depth: 250,
      engineLevel: 3
    }
  };

  constructor(
    public authService: AuthService,
    private soundService: SoundService,
    private router: Router
  ) {}

  get currentLevelData(): LevelNode {
    return this.levelsData[this.selectedLevel] || this.levelsData[1];
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('ocean_quest_highest_level_cleared');
    this.highestCleared = saved ? parseInt(saved, 10) : 0;

    // Default select highest unlocked level (capped at 3)
    this.selectedLevel = Math.min(3, Math.max(1, this.highestCleared + 1));

    const profile = localStorage.getItem('ocean_quest_user');
    if (profile) {
      try {
        const u = JSON.parse(profile);
        if (u.username) this.pilotCallsign = u.username;
      } catch (e) {}
    }
  }

  isLevelUnlocked(lvl: number): boolean {
    if (lvl === 1) return true;
    return this.highestCleared >= lvl - 1;
  }

  selectNode(lvl: number): void {
    if (!this.isLevelUnlocked(lvl)) {
      this.soundService.playHurt();
      return;
    }
    this.selectedLevel = lvl;
    this.soundService.playBubble();
    this.isLaunchModalOpen = true;
  }

  closeLaunchModal(): void {
    this.isLaunchModalOpen = false;
  }

  launchSelectedLevel(): void {
    const node = this.currentLevelData;
    this.isLaunchModalOpen = false;
    this.soundService.playWelcomeFanfare();
    this.router.navigate(['/game'], { queryParams: { level: node.engineLevel } });
  }

  openSettings(): void {
    this.soundService.playBubble();
    // Navigate or open settings
    this.router.navigate(['/']);
  }

  goToMainMenu(): void {
    this.router.navigate(['/']);
  }

  goToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  onAvatarError(event: any): void {
    if (event?.target) {
      event.target.style.display = 'none';
    }
  }
}
