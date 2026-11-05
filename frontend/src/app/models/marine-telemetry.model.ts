/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: frontend/src/app/models/marine-telemetry.model.ts
 * Description: Model for Real-Time Marine Weather & Ocean Telemetry API.
 * Kept strictly separate from fish-api.model.ts for low coupling.
 */

export interface MarineTelemetry {
  city: string;
  country: string;
  flag: string;
  latitude: number;
  longitude: number;
  waterTemperature: number; // in °C
  airTemperature: number; // in °C
  seaCondition: 'Calm' | 'Moderate' | 'Rough';
  waveHeight: number; // in meters
  currentSpeedKmH: number; // in km/h
  isNightDive: boolean;
  ambientLighting: 'day' | 'golden_hour' | 'night';
  sunriseTime: string;
  sunsetTime: string;
  climateWarning?: string;
  fetchedAt?: string;
}
