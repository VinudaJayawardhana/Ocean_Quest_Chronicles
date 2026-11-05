/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * VIRTUAL IDENTITY: Protects /game and /profile. The decision is based on the server session.
 */
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.checkSession().pipe(map((ok) => (ok ? true : this.router.createUrlTree(['/login']))));
  }
}
