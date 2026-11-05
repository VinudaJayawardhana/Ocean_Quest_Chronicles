/**
 * Source/AI-generated: Ocean Quest Chronicles Project (see docs/references.md)
 * File: frontend/src/app/services/marine.service.ts
 * Description: Dedicated Angular service for Marine Weather, Water Temperature, and Day/Night APIs.
 * Kept strictly in a separate file from the Fish Game API and ApiService for clean modularity.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { MarineTelemetry } from '../models/marine-telemetry.model';

@Injectable({
  providedIn: 'root'
})
export class MarineService {
  private defaultTelemetry: MarineTelemetry = {
    city: 'Colombo Port Base',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    latitude: 6.9271,
    longitude: 79.8612,
    waterTemperature: 24.5,
    airTemperature: 28.0,
    seaCondition: 'Calm',
    waveHeight: 0.8,
    currentSpeedKmH: 2.4,
    isNightDive: false,
    ambientLighting: 'day',
    sunriseTime: '06:05 AM',
    sunsetTime: '06:18 PM',
    climateWarning: ''
  };

  private telemetrySubject = new BehaviorSubject<MarineTelemetry>(this.defaultTelemetry);
  public telemetry$: Observable<MarineTelemetry> = this.telemetrySubject.asObservable();

  constructor(private http: HttpClient) {
    this.detectAndLoadTelemetry();
  }

  get currentTelemetry(): MarineTelemetry {
    return this.telemetrySubject.value;
  }

  /**
   * Automatically requests browser GPS or falls back to server geolocation
   */
  detectAndLoadTelemetry(): void {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          this.fetchTelemetry(lat, lon);
        },
        () => {
          // Fallback to default coordinates
          this.fetchTelemetry();
        },
        { timeout: 5000 }
      );
    } else {
      this.fetchTelemetry();
    }
  }

  fetchTelemetry(lat?: number, lon?: number): Observable<MarineTelemetry> {
    let url = '/api/marine/telemetry';
    if (lat !== undefined && lon !== undefined) {
      url += `?lat=${lat}&lon=${lon}`;
    }

    return this.http.get<MarineTelemetry>(url, { withCredentials: true }).pipe(
      tap((data) => {
        if (data) {
          this.telemetrySubject.next(data);
        }
      }),
      catchError(() => {
        // Return default resilient telemetry on connection issue
        return of(this.defaultTelemetry);
      })
    );
  }

  /**
   * Environmental climate modifier on scuba oxygen consumption
   * Cold waters (<16°C) cause hypothermia strain, increasing oxygen burn by +15%.
   */
  getOxygenDrainModifier(): number {
    const temp = this.currentTelemetry.waterTemperature;
    if (temp < 16) return 1.15;
    if (temp > 29) return 1.05;
    return 1.0;
  }
}
