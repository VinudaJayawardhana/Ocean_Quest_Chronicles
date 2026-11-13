/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md).
 * Scaffolded with an AI assistant and reviewed/edited by the author.
 */
import { Injectable } from '@angular/core';
import { GameEventBus, GameEvent } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;

  public isMuted: boolean = false;
  public masterVolume: number = 0.5; // 0.0 to 1.0
  public musicVolume: number = 0.7;  // 0.0 to 1.0
  public sfxVolume: number = 0.7;    // 0.0 to 1.0
  public voicePersona: 'commander' | 'tactical' | 'robotic' = 'commander';

  private bgmAudio: HTMLAudioElement | null = null;
  public isBgmPlaying: boolean = false;

  constructor(private bus: GameEventBus) {
    // EVENT-DRIVEN: sounds are reactions to game events; the engine does not call this service.
    this.bus.events$.subscribe((e) => this.onGameEvent(e));
    
    // Restore saved volume and mute states
    const savedMuted = localStorage.getItem('ocean_quest_muted');
    this.isMuted = savedMuted === 'true';

    const savedMaster = localStorage.getItem('oq_master_vol');
    if (savedMaster !== null) {
      this.masterVolume = Math.max(0, Math.min(100, parseInt(savedMaster, 10))) / 100;
    }

    const savedMusic = localStorage.getItem('oq_music_vol');
    if (savedMusic !== null) {
      const vol = Math.max(0, Math.min(100, parseInt(savedMusic, 10))) / 100;
      this.musicVolume = vol;
      this.sfxVolume = vol;
    }

    const savedPersona = localStorage.getItem('oq_voice_persona') as 'commander' | 'tactical' | 'robotic' | null;
    if (savedPersona === 'commander' || savedPersona === 'tactical' || savedPersona === 'robotic') {
      this.voicePersona = savedPersona;
    }

    this.initBgm();
  }

  private initBgm(): void {
    try {
      this.bgmAudio = new Audio('assets/audio/ocean_ambient_bgm.wav');
      this.bgmAudio.loop = true;
      this.updateBgmVolume();
    } catch {
      // Audio element not supported
    }
  }

  private updateBgmVolume(): void {
    if (!this.bgmAudio) return;
    const effectiveMaster = this.isMuted ? 0 : this.masterVolume;
    const effectiveMusic = this.isMuted ? 0 : this.musicVolume;
    // Scale 0.35 ceiling so background music stays soothing underneath SFX
    this.bgmAudio.volume = Math.max(0, Math.min(1, 0.35 * effectiveMusic * effectiveMaster));
  }

  /**
   * Start ambient background music from assets/audio/ocean_ambient_bgm.wav
   */
  startBgm(): void {
    if (this.isMuted || !this.bgmAudio) return;
    this.bgmAudio.play().then(() => {
      this.isBgmPlaying = true;
    }).catch(() => {
      // Autoplay was blocked; wait for user gesture
      const unlockListener = () => {
        if (!this.isMuted && this.bgmAudio) {
          this.bgmAudio.play().catch(() => {});
          this.isBgmPlaying = true;
        }
        window.removeEventListener('click', unlockListener);
        window.removeEventListener('keydown', unlockListener);
      };
      window.addEventListener('click', unlockListener, { once: true });
      window.addEventListener('keydown', unlockListener, { once: true });
    });
  }

  stopBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.isBgmPlaying = false;
    }
  }

  toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isBgmPlaying;
  }

  private initContext(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGainNode = this.audioCtx.createGain();
        this.sfxGainNode = this.audioCtx.createGain();
        this.sfxGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.audioCtx.destination);
        this.updateVolumes();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public updateVolumes(): void {
    const effectiveMaster = this.isMuted ? 0 : this.masterVolume;
    const effectiveSfx = this.isMuted ? 0 : this.sfxVolume;

    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;
      if (this.masterGainNode) {
        this.masterGainNode.gain.cancelScheduledValues(now);
        this.masterGainNode.gain.setValueAtTime(effectiveMaster, now);
      }
      if (this.sfxGainNode) {
        this.sfxGainNode.gain.cancelScheduledValues(now);
        this.sfxGainNode.gain.setValueAtTime(effectiveSfx, now);
      }
    }

    this.updateBgmVolume();
  }

  public setMasterVolume(percent: number): void {
    const val = Math.max(0, Math.min(100, percent));
    this.masterVolume = val / 100;
    localStorage.setItem('oq_master_vol', String(val));

    if (val === 0 && !this.isMuted) {
      this.isMuted = true;
      localStorage.setItem('ocean_quest_muted', 'true');
      this.stopBgm();
    } else if (val > 0 && this.isMuted) {
      this.isMuted = false;
      localStorage.setItem('ocean_quest_muted', 'false');
      this.startBgm();
    }
    this.updateVolumes();
  }

  public setVoicePersona(persona: 'commander' | 'tactical' | 'robotic'): void {
    this.voicePersona = persona;
    localStorage.setItem('oq_voice_persona', persona);
  }

  public setMusicVolume(percent: number): void {
    const val = Math.max(0, Math.min(100, percent));
    this.musicVolume = val / 100;
    this.sfxVolume = val / 100;
    localStorage.setItem('oq_music_vol', String(val));
    this.updateVolumes();
  }

  private connectToDestination(gain: GainNode): void {
    if (this.sfxGainNode) {
      gain.connect(this.sfxGainNode);
    } else if (this.audioCtx) {
      this.connectToDestination(gain);
    }
  }

  private onGameEvent(e: GameEvent): void {
    switch (e.type) {
      case 'Swim': return this.playSwim();
      case 'BubbleCollected': return this.playBubble();
      case 'SharkBite': 
        this.playSharkBite();
        return;
      case 'SwordSlash':
      case 'GuardAttack': return this.playSwordSlash();
      case 'OctopusAttack':
      case 'DiverHurt': return this.playHurt();
      case 'ChestUnlocked': 
        this.playChestUnlock();
        this.speakNavalDispatch('Mystery cargo unlocked.');
        return;
      case 'PuzzleRequested':
        this.playAlertPing();
        this.speakNavalDispatch('Sonar cipher linked.');
        return;
      case 'LevelChanged': return this.playAlertPing();
      case 'GameOver': 
        this.stopBgm(); 
        this.playGameOver();
        this.speakNavalDispatch('Warning. Mission compromised.', true);
        return;
      default: return;
    }
  }

  /**
   * NAVAL RADIO DISPATCH VOICE COMMUNICATOR (Automated Submarine Comms)
   * Uses Web Speech Synthesis API with naval radio squelch audio filter.
   * Fully decoupled and respects global audio mute state.
   */
  speakNavalDispatch(message: string, isAlert: boolean = false): void {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      this.playRadioSquelch();

      const utterance = new SpeechSynthesisUtterance(message);
      const voices = window.speechSynthesis.getVoices();

      if (this.voicePersona === 'tactical') {
        // Crisp Tactical Comms AI Officer (Female English tone)
        utterance.rate = 1.08;
        utterance.pitch = isAlert ? 1.25 : 1.10;
        const tacticalVoice = voices.find(v => v.lang.startsWith('en') && (
          v.name.includes('Zira') || v.name.includes('Aria') || v.name.includes('Google UK English Female') || 
          v.name.includes('Samantha') || v.name.includes('Female') || v.name.includes('Jenny')
        ));
        if (tacticalVoice) utterance.voice = tacticalVoice;
      } else if (this.voicePersona === 'robotic') {
        // Cybernetic Sonar Dispatcher (Low mechanical cadence)
        utterance.rate = 1.14;
        utterance.pitch = isAlert ? 0.8 : 0.62;
        const roboticVoice = voices.find(v => v.lang.startsWith('en') && (
          v.name.includes('Robo') || v.name.includes('Natural') || v.name.includes('Google US English') ||
          v.name.includes('Mark') || v.name.includes('David')
        ));
        if (roboticVoice) utterance.voice = roboticVoice;
      } else {
        // Deep Naval Submarine Radio Commander (Authoritative male radio tone)
        utterance.rate = 0.98;
        utterance.pitch = isAlert ? 1.05 : 0.82;
        const commanderVoice = voices.find(v => v.lang.startsWith('en') && (
          v.name.includes('David') || v.name.includes('Guy') || v.name.includes('George') || 
          v.name.includes('Male') || v.name.includes('Daniel')
        ));
        if (commanderVoice) utterance.voice = commanderVoice;
      }

      utterance.volume = Math.max(0, Math.min(1, 0.9 * (this.isMuted ? 0 : this.masterVolume)));
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is disabled on client device
    }
  }

  private playRadioSquelch(): void {
    try {
      this.initContext();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
      osc.connect(gain);
      this.connectToDestination(gain);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {}
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('ocean_quest_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  /**
   * Soft water swim stroke sound
   */
  playSwim(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Crisp bubble pop sound when collecting oxygen
   */
  playBubble(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  /**
   * Hurt / impact sound
   */
  playHurt(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  /**
   * Shark bite snap
   */
  playSharkBite(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  /**
   * Pirate sword slash
   */
  playSwordSlash(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Chest puzzle unlocked fanfare
   */
  playChestUnlock(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        const start = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

        osc.connect(gain);
        this.connectToDestination(gain);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {}
  }

  /**
   * Low alert sonar ping when hazard approaches
   */
  playAlertPing(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

      osc.connect(gain);
      this.connectToDestination(gain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Game Over descending chime
   */
  playGameOver(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        const start = now + idx * 0.2;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

        osc.connect(gain);
        this.connectToDestination(gain);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  /**
   * Welcoming orchestral/marine harmonic chime for first-time pilots
   */
  playWelcomeFanfare(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      // Uplifting ocean chord progression: F4, A4, C5, E5, G5, C6
      const chord = [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        const start = now + idx * 0.12;
        const dur = 0.55;

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        this.connectToDestination(gain);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {}
  }
}

