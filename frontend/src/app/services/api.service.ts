/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: services/api.service.ts
 * INTEROPERABILITY: JSON over HTTP(S) to our Express API. The Fish Game API is reached through
 * /puzzle/* so the answer is verified on the server and never travels to the browser early.
 * VIRTUAL IDENTITY: No tokens are handled here; CredentialsInterceptor adds the session cookie.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LeaderboardEntry } from '../models/user.model';
import { AnswerResult, PuzzleChallenge } from '../models/fish-api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getLeaderboard(limit = 20, level?: number | null, mode: 'best' | 'cumulative' = 'best'): Observable<LeaderboardEntry[]> {
    let url = `${this.base}/leaderboard?limit=${limit}&mode=${mode}`;
    if (level !== undefined && level !== null) {
      url += `&level=${level}`;
    }
    return this.http.get<LeaderboardEntry[]>(url);
  }

  /** The server computes the real score from the answers it verified; we only send exploration data. */
  saveScore(data: { depthReached: number; explorationScore: number; level?: number }): Observable<unknown> {
    return this.http.post(`${this.base}/scores`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.base}/profile`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.base}/profile`, profileData);
  }

  /** Record daily challenge completion and claim bonus XP */
  recordDailyChallenge(date: string): Observable<{ message: string; completed: boolean }> {
    return this.http.post<{ message: string; completed: boolean }>(`${this.base}/profile/daily-challenge`, { date });
  }

  /** Save level clearance progression to user's persistent virtual identity on the server */
  saveProgress(levelCleared: number): Observable<{ message: string; highestLevel: number }> {
    return this.http.post<{ message: string; highestLevel: number }>(`${this.base}/profile/progress`, { levelCleared });
  }

  // ---- Sonar Challenge (Fish Game API through our server) ----
  startRun(): Observable<unknown> {
    return this.http.post(`${this.base}/puzzle/run`, {});
  }

  newPuzzle(): Observable<PuzzleChallenge> {
    return this.http.get<PuzzleChallenge>(`${this.base}/puzzle/new`);
  }

  answerPuzzle(puzzleId: string, answer: number): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`${this.base}/puzzle/answer`, { puzzleId, answer });
  }
}
