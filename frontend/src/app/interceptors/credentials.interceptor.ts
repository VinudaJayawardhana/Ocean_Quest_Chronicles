/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * VIRTUAL IDENTITY: Makes the browser send the HttpOnly server session cookie
 * to OUR API (localhost:5000). The cookie is the sole bearer of identity.
 * Requests to third-party sites (e.g. ipapi.co) are untouched to prevent cookie leaks.
 */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.startsWith(environment.apiBaseUrl)) {
      return next.handle(req.clone({ withCredentials: true }));
    }
    return next.handle(req);
  }
}
