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

  public solarMode: 'auto' | 'day' | 'sunset' | 'night' = (localStorage.getItem('oq_solar_mode') as any) || 'auto';
  private solarModeSubject = new BehaviorSubject<'auto' | 'day' | 'sunset' | 'night'>(this.solarMode);
  public solarMode$: Observable<'auto' | 'day' | 'sunset' | 'night'> = this.solarModeSubject.asObservable();

  public setSolarMode(mode: 'auto' | 'day' | 'sunset' | 'night'): void {
    this.solarMode = mode;
    localStorage.setItem('oq_solar_mode', mode);
    this.solarModeSubject.next(mode);
  }

  public get currentAtmosphere(): 'day' | 'sunset' | 'night' {
    if (this.solarMode !== 'auto') {
      return this.solarMode;
    }
    const ambient = this.currentTelemetry.ambientLighting;
    if (ambient === 'night' || this.currentTelemetry.isNightDive) return 'night';
    if (ambient === 'sunset' || ambient === 'golden_hour') return 'sunset';
    return 'day';
  }

  /**
   * Fetches real-time solar celestial telemetry from the Sunrise-Sunset API.
   * Free, public astronomical API (api.sunrise-sunset.org).
   */
  public fetchSolarTimes(lat: number = 6.9271, lon: number = 79.8612): void {
    const solarUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
    this.http.get<any>(solarUrl).pipe(
      catchError(() => of(null))
    ).subscribe((res) => {
      if (res && res.status === 'OK' && res.results) {
        const now = new Date();
        const sunrise = new Date(res.results.sunrise);
        const sunset = new Date(res.results.sunset);
        const twilightEnd = new Date(res.results.civil_twilight_end);
        const twilightBegin = new Date(res.results.civil_twilight_begin);

        const sunriseStr = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const sunsetStr = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Golden hour sunset window: 40 mins before sunset until civil twilight end
        const sunsetWindowStart = new Date(sunset.getTime() - 40 * 60 * 1000);
        let ambient: 'day' | 'sunset' | 'night' = 'day';
        let night = false;

        if (now >= twilightBegin && now < sunsetWindowStart) {
          ambient = 'day';
          night = false;
        } else if (now >= sunsetWindowStart && now <= twilightEnd) {
          ambient = 'sunset';
          night = false;
        } else {
          ambient = 'night';
          night = true;
        }

        const updated: MarineTelemetry = {
          ...this.currentTelemetry,
          sunriseTime: sunriseStr,
          sunsetTime: sunsetStr,
          ambientLighting: ambient,
          isNightDive: night
        };
        this.telemetrySubject.next(updated);
      }
    });
  }

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
