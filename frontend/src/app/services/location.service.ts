/**
 * Ocean Quest Chronicles Project (see docs/references.md).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LocationData {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor(private http: HttpClient) {}

  getUserLocation(): Observable<LocationData> {
    return this.http.get<LocationData>(environment.ipApiUrl).pipe(
      catchError((error) => {
        console.warn('Geolocation lookup failed, falling back to defaults:', error);
        return of({
          ip: '127.0.0.1',
          city: 'Unknown City',
          country_name: 'Unknown Country'
        });
      })
    );
  }
}
