/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Location & Hospital Discovery Service
 * Handles multi-permission requests (Geolocation, Microphone, Notifications),
 * automatic reverse-geocoding, proximity calculation via Haversine formula,
 * and nearby hospital rankings.
 */

import { Hospital } from '../types';
import { StorageService } from './storageService';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface DetectedArea {
  areaName: string;
  city: string;
  state: string;
  formatted: string;
  coordinates: LocationCoordinates;
  source: 'gps' | 'preset' | 'ip';
}

export interface PermissionsStatus {
  location: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'default';
}

export const PRESET_AREAS: DetectedArea[] = [
  {
    areaName: 'Medical Enclave, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    formatted: 'Koramangala, Bengaluru South, Karnataka',
    coordinates: { latitude: 12.9352, longitude: 77.6245 },
    source: 'preset',
  },
  {
    areaName: 'HAL & Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    formatted: 'Indiranagar / Old Airport Rd, Bengaluru East, Karnataka',
    coordinates: { latitude: 12.9650, longitude: 77.6450 },
    source: 'preset',
  },
  {
    areaName: 'City Market & Fort',
    city: 'Bengaluru',
    state: 'Karnataka',
    formatted: 'Victoria Hospital Area, Bengaluru Central, Karnataka',
    coordinates: { latitude: 12.9620, longitude: 77.5750 },
    source: 'preset',
  },
  {
    areaName: 'Ansari Nagar / AIIMS',
    city: 'New Delhi',
    state: 'Delhi',
    formatted: 'Ring Road Medical Hub, South Delhi, Delhi',
    coordinates: { latitude: 28.5672, longitude: 77.2100 },
    source: 'preset',
  },
  {
    areaName: 'Connaught Place / Central',
    city: 'New Delhi',
    state: 'Delhi',
    formatted: 'Connaught Place & Ram Manohar Lohia Area, New Delhi',
    coordinates: { latitude: 28.6304, longitude: 77.2177 },
    source: 'preset',
  },
  {
    areaName: 'Parel Medical Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    formatted: 'Parel / KEM Hospital Zone, Mumbai, Maharashtra',
    coordinates: { latitude: 19.0028, longitude: 72.8423 },
    source: 'preset',
  },
  {
    areaName: 'Bandra Reclamation',
    city: 'Mumbai',
    state: 'Maharashtra',
    formatted: 'Bandra West & Reclamation, Mumbai Suburban, Maharashtra',
    coordinates: { latitude: 19.0510, longitude: 72.8285 },
    source: 'preset',
  },
  {
    areaName: 'Punjagutta / Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    formatted: 'NIMS Campus, Punjagutta, Hyderabad, Telangana',
    coordinates: { latitude: 17.4243, longitude: 78.4526 },
    source: 'preset',
  },
  {
    areaName: 'Park Town & Central',
    city: 'Chennai',
    state: 'Tamil Nadu',
    formatted: 'Rajiv Gandhi GH Zone, Park Town, Chennai, Tamil Nadu',
    coordinates: { latitude: 13.0818, longitude: 80.2785 },
    source: 'preset',
  },
  {
    areaName: 'Camp & Station Road',
    city: 'Pune',
    state: 'Maharashtra',
    formatted: 'Sassoon Hospital Vicinity, Pune, Maharashtra',
    coordinates: { latitude: 18.5284, longitude: 73.8742 },
    source: 'preset',
  },
];

const STORAGE_KEY_SELECTED_HOSPITAL = 'aarogyaflow_selected_hospital_id';
const STORAGE_KEY_DETECTED_AREA = 'aarogyaflow_detected_area';
const STORAGE_KEY_PERMISSIONS_ONBOARDED = 'aarogyaflow_patient_permissions_done';

export const LocationService = {
  /**
   * Calculates Haversine distance in kilometres
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  },

  /**
   * Requests browser geolocation
   */
  async requestUserLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          let message = 'Location access was not granted. You can select your area manually.';
          if (error.code === error.TIMEOUT) {
            message = 'Location request timed out. Please choose your area manually.';
          } else if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission was denied. Please select your area manually.';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000,
        }
      );
    });
  },

  /**
   * Requests microphone permission for voice assistant
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release tracks
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Requests notification permission for OPD Token queue alerts
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return await Notification.requestPermission();
      }
      return 'default';
    } catch {
      return 'default';
    }
  },

  /**
   * Requests all essential permissions at once
   */
  async requestAllPermissions(): Promise<{
    status: PermissionsStatus;
    coords?: LocationCoordinates;
  }> {
    const status: PermissionsStatus = {
      location: 'prompt',
      microphone: 'prompt',
      notifications: 'default',
    };

    let coords: LocationCoordinates | undefined;

    // 1. Location
    try {
      coords = await this.requestUserLocation();
      status.location = 'granted';
    } catch {
      status.location = 'denied';
    }

    // 2. Microphone
    try {
      const micGranted = await this.requestMicrophonePermission();
      status.microphone = micGranted ? 'granted' : 'denied';
    } catch {
      status.microphone = 'denied';
    }

    // 3. Notification
    try {
      const notif = await this.requestNotificationPermission();
      status.notifications = notif === 'granted' ? 'granted' : notif === 'denied' ? 'denied' : 'default';
    } catch {
      status.notifications = 'default';
    }

    this.setPermissionsOnboarded(true);

    return { status, coords };
  },

  /**
   * Reverse-geocodes coordinates to identify area, district, and city
   */
  async reverseGeocode(coords: LocationCoordinates): Promise<DetectedArea> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=14&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const areaName =
          address.suburb ||
          address.neighbourhood ||
          address.commercial ||
          address.residential ||
          address.quarter ||
          address.city_district ||
          address.city ||
          'Local Healthcare Zone';
        const city = address.city || address.town || address.county || address.state_district || 'Bengaluru';
        const state = address.state || 'Karnataka';

        const detected: DetectedArea = {
          areaName,
          city,
          state,
          formatted: `${areaName}, ${city}, ${state}`,
          coordinates: coords,
          source: 'gps',
        };
        this.saveDetectedArea(detected);
        return detected;
      }
    } catch (e) {
      console.warn('Online reverse geocoding unavailable, using local geographic clustering:', e);
    }

    // Fallback: calculate nearest preset area from local database
    const nearestPreset = this.getClosestPresetArea(coords);
    const resolved: DetectedArea = {
      ...nearestPreset,
      coordinates: coords,
      source: 'gps',
    };
    this.saveDetectedArea(resolved);
    return resolved;
  },

  /**
   * Finds the closest preset area to given coordinates
   */
  getClosestPresetArea(coords: LocationCoordinates): DetectedArea {
    let closest = PRESET_AREAS[0];
    let minDistance = Infinity;

    for (const area of PRESET_AREAS) {
      const dist = this.calculateDistanceKm(
        coords.latitude,
        coords.longitude,
        area.coordinates.latitude,
        area.coordinates.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = area;
      }
    }

    return closest;
  },

  /**
   * Returns registered hospitals sorted by distance from user coordinates
   */
  getNearbyHospitals(userCoords?: LocationCoordinates): Hospital[] {
    const hospitals = StorageService.getHospitals();

    if (!userCoords) {
      // Default to first preset (Bengaluru Medical Enclave)
      const defaultCoords = PRESET_AREAS[0].coordinates;
      return hospitals
        .map(h => {
          const distance = this.calculateDistanceKm(
            defaultCoords.latitude,
            defaultCoords.longitude,
            h.latitude,
            h.longitude
          );
          return { ...h, distanceKm: distance };
        })
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return hospitals
      .map(h => {
        const distance = this.calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          h.latitude,
          h.longitude
        );
        return { ...h, distanceKm: distance };
      })
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  },

  /**
   * Persistence Helpers for Selected Hospital & Area
   */
  saveDetectedArea(area: DetectedArea): void {
    try {
      localStorage.setItem(STORAGE_KEY_DETECTED_AREA, JSON.stringify(area));
    } catch (err) {
      console.error('Error storing detected area:', err);
    }
  },

  getSavedDetectedArea(): DetectedArea | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DETECTED_AREA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSelectedHospital(hospital: Hospital): void {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_HOSPITAL, hospital.hospitalId);
    } catch (err) {
      console.error('Error storing selected hospital:', err);
    }
  },

  getSelectedHospitalId(): string {
    return localStorage.getItem(STORAGE_KEY_SELECTED_HOSPITAL) || 'HOSP001';
  },

  getSelectedHospital(): Hospital {
    const all = StorageService.getHospitals();
    const id = this.getSelectedHospitalId();
    return all.find(h => h.hospitalId === id) || all[0];
  },

  isPermissionsOnboarded(): boolean {
    return localStorage.getItem(STORAGE_KEY_PERMISSIONS_ONBOARDED) === 'true';
  },

  setPermissionsOnboarded(done: boolean): void {
    localStorage.setItem(STORAGE_KEY_PERMISSIONS_ONBOARDED, done ? 'true' : 'false');
  },
};

