/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: services/event-bus.service.ts
 *
 * EVENT-DRIVEN PROGRAMMING: A tiny publish/subscribe bus built on an RxJS Subject.
 *  - Producers (GameEngineService, GameViewportComponent) only call emit(...). They do not know
 *    who is listening.
 *  - Consumers (SoundService today; analytics, achievements, ... tomorrow) subscribe to events$.
 * COUPLING/COHESION: Low coupling - the engine no longer imports the sound service.
 */
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export type GameEvent =
  | { type: 'Swim' }
  | { type: 'BubbleCollected' }
  | { type: 'SharkBite' }
  | { type: 'SwordSlash' }
  | { type: 'OctopusAttack' }
  | { type: 'GuardAttack' }
  | { type: 'DiverHurt'; amount: number }
  | { type: 'LevelChanged'; level: 1 | 2 | 3 }
  | { type: 'PuzzleRequested' }
  | { type: 'PuzzleLoaded' }
  | { type: 'AnswerChecked'; correct: boolean; points: number }
  | { type: 'ChestUnlocked'; points: number }
  | { type: 'GameOver'; score: number };

@Injectable({ providedIn: 'root' })
export class GameEventBus {
  private readonly subject = new Subject<GameEvent>();
  readonly events$: Observable<GameEvent> = this.subject.asObservable();

  emit(event: GameEvent): void {
    this.subject.next(event);
  }

  /** Listen to one kind of event, fully typed. */
  on<T extends GameEvent['type']>(type: T): Observable<Extract<GameEvent, { type: T }>> {
    return this.events$.pipe(filter((e): e is Extract<GameEvent, { type: T }> => e.type === type));
  }
}
