/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures
 * File: services/auth.service.ts
 * VIRTUAL IDENTITY: The server session (/api/me) is the single source of truth.
 * If the backend is off or restarted, the client automatically invalidates the identity,
 * clears local caches, and logs the pilot out.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // Ping server immediately on app startup
    this.checkSession().subscribe();
  }

  register(data: { username: string; email: string; password: string; location?: unknown }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/signup`, data).pipe(tap((r) => this.setUser(r.user)));
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, credentials).pipe(tap((r) => { this.clearUserStorage(); this.setUser(r.user); }));
  }

    clearUserStorage(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('ocean_quest_best_score');
    localStorage.removeItem('ocean_quest_level1_best');
    localStorage.removeItem('ocean_quest_level2_best');
    localStorage.removeItem('ocean_quest_level3_best');
    localStorage.removeItem('ocean_quest_max_depth');
    localStorage.removeItem('ocean_quest_highest_level_cleared');
    localStorage.removeItem('oq_total_runs');
    localStorage.removeItem('oq_achievements');
  }

  logout(): void {
    this.clearUserStorage();
    this.setUser(null);
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => undefined });
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  /**
   * VIRTUAL IDENTITY: Generates a persistent DiceBear Diver / Submarine Pilot Avatar
   * Based on the user's call-sign / username and sector progression level using the free DiceBear API.
   * Higher sectors grant upgraded cybernetic helmets and distinctive oceanic colorways.
   */
  getDiverAvatar(seed?: string, level?: number): string {
    const user = this.userSubject.value;
    const name = (seed || user?.username || 'Naval Diver').trim();
    const lvl = level !== undefined && level !== null ? level : parseInt(localStorage.getItem('ocean_quest_highest_level_cleared') || '1', 10);

    // Clean, robust DiceBear 7.x palette per sector level
    let bg = '0284c7'; // Level 1 (Shark Waters): Oceanic Azure
    if (lvl >= 3) {
      bg = '7c3aed';   // Level 3 (Abyss Trench): Deep Bioluminescent Purple
    } else if (lvl === 2) {
      bg = 'd97706';   // Level 2 (Pirate Cove): Corsair Amber Gold
    }

    // Consistent facial identity: seed is strictly the pilot's callsign so facial features remain identical across all levels/leaderboard rows
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bg}`;
  }

  /**
   * Offline / network resilient SVG fallback in case DiceBear CDN is blocked or unavailable
   */
  getDiverAvatarFallback(level = 1): string {
    const colors: { [k: number]: string } = { 1: '#0284c7', 2: '#d97706', 3: '#7c3aed' };
    const bg = colors[level] || '#0284c7';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="32" fill="${bg}"/><rect x="20" y="18" width="24" height="20" rx="4" fill="white" fill-opacity="0.95"/><circle cx="26" cy="26" r="3" fill="${bg}"/><circle cx="38" cy="26" r="3" fill="${bg}"/><rect x="24" y="31" width="16" height="3" rx="1.5" fill="${bg}"/><rect x="28" y="38" width="8" height="12" rx="2" fill="white" fill-opacity="0.95"/><rect x="14" y="40" width="8" height="6" rx="2" fill="white" fill-opacity="0.75"/><rect x="42" y="40" width="8" height="6" rx="2" fill="white" fill-opacity="0.75"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  handleAvatarError(event: Event, level = 1): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getDiverAvatarFallback(level);
      target.onerror = null;
    }
  }

  /**
   * Strictly verifies identity with the backend service.
   * If the server is offline or session expired, auto-logs out.
   */
  checkSession(): Observable<boolean> {
    return this.http.get<{ user: User }>(`${this.base}/me`).pipe(
      tap((r) => this.setUser(r.user)),
      map(() => true),
      catchError(() => {
        // Server is off or unauthenticated -> auto logout
        this.setUser(null);
        return of(false);
      })
    );
  }

  private setUser(user: User | null): void {
    const prev = this.userSubject.value;
    this.userSubject.next(user);
    if (user) {
      if (!prev || prev.id !== user.id) {
        // Switching to a different user: clear previous player's cached telemetry
        localStorage.removeItem('ocean_quest_highest_level_cleared');
        localStorage.removeItem('ocean_quest_best_score');
        localStorage.removeItem('ocean_quest_level1_best');
        localStorage.removeItem('ocean_quest_level2_best');
        localStorage.removeItem('ocean_quest_level3_best');
        localStorage.removeItem('ocean_quest_max_depth');
        localStorage.removeItem('oq_total_runs');
      }
      localStorage.setItem('ocean_quest_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ocean_quest_user');
      localStorage.removeItem('ocean_quest_highest_level_cleared');
      localStorage.removeItem('ocean_quest_best_score');
      localStorage.removeItem('ocean_quest_level1_best');
      localStorage.removeItem('ocean_quest_level2_best');
      localStorage.removeItem('ocean_quest_level3_best');
      localStorage.removeItem('ocean_quest_max_depth');
      localStorage.removeItem('oq_total_runs');
    }
  }
}
