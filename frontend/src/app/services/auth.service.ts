/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: services/auth.service.ts
 * VIRTUAL IDENTITY: The identity is an HttpOnly session cookie set by the server. The browser
 * keeps NO password and NO token (nothing for an XSS attack to steal). This service only
 * remembers "who am I" (from /api/me) so the UI can show/hide pages.
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
  private sessionChecked = false;
  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkSession().subscribe(); // restore the identity after a page refresh
  }

  register(data: { username: string; email: string; password: string; location?: unknown }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/signup`, data).pipe(tap((r) => this.setUser(r.user)));
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, credentials).pipe(tap((r) => this.setUser(r.user)));
  }

  logout(): void {
    this.setUser(null);
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => undefined });
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  /** Asks the server whether the cookie is still valid (used by the route guard). */
  checkSession(): Observable<boolean> {
    if (this.sessionChecked) return of(this.isLoggedIn());
    return this.http.get<{ user: User }>(`${this.base}/me`).pipe(
      tap((r) => this.setUser(r.user)),
      map(() => true),
      catchError(() => {
        this.setUser(null);
        return of(false);
      })
    );
  }

  private setUser(user: User | null): void {
    this.sessionChecked = true;
    this.userSubject.next(user);
  }
}
