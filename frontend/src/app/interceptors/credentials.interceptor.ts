/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * VIRTUAL IDENTITY: Makes the browser send the session cookie to OUR API (localhost:5000).
 * Requests to other sites (e.g. ipapi.co) are left alone so no cookie leaks to third parties.
 */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req.url.startsWith(environment.apiBaseUrl) ? req.clone({ withCredentials: true }) : req);
  }
}
