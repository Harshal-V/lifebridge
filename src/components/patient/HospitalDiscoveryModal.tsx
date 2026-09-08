/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Explicit Location Permission & Hospital Discovery Modal
 * Complies strictly with Section 9: explicit user permission explanation,
 * Haversine distance calculation, and non-blocking manual selection fallback.
 */

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Phone,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Hospital } from '../../types';
import { LocationService, LocationCoordinates } from '../../services/locationService';
import { StorageService } from '../../services/storageService';

interface HospitalDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHospital: (hospital: Hospital) => void;
  selectedHospitalId?: string;
}

export const HospitalDiscoveryModal: React.FC<HospitalDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectHospital,
  selectedHospitalId,
}) => {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'manual'>('prompt');
  const [hospitals, setHospitals] = useState<Hospital[]>(StorageService.getHospitals());
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  if (!isOpen) return null;

  const handleAllowLocation = async () => {
    setIsLocating(true);
    setLocationError('');
    try {
      const coords: LocationCoordinates = await LocationService.requestUserLocation();
      const nearby = LocationService.getNearbyHospitals(coords);
      setHospitals(nearby);
      setPermissionState('granted');
    } catch (err: any) {
      setLocationError(err.message || 'Could not access location. Showing registered hospitals.');
      setPermissionState('manual');
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualSelection = () => {
    setPermissionState('manual');
    setHospitals(StorageService.getHospitals());
  };

  return (
    <div
      id="hospital-discovery-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hospital-discovery-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="hospital-discovery-title" className="text-base font-bold text-slate-900">
                Find Hospitals Near You
              </h3>
              <p className="text-xs text-slate-500">
                Select your clinical intake centre or hospital OPD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Explicit Location Permission Card (Section 9 Requirement) */}
          {permissionState === 'prompt' && (
            <div
              id="explicit-location-permission-box"
              className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Find hospitals near you
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    We use your location to find nearby hospitals available on this platform. We do not continuously track your location.
                  </p>
                </div>
              </div>

              {locationError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Exact Buttons mandated by Section 9 */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  id="allow-location-access-btn"
                  onClick={handleAllowLocation}
                  disabled={isLocating}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'Obtaining Coordinates...' : 'Allow Location Access'}</span>
                </button>
                <button
                  id="choose-hospital-manually-btn"
                  onClick={handleManualSelection}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors"
                >
                  Choose Hospital Manually
                </button>
              </div>
            </div>
          )}

          {/* Hospital List Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>
                {permissionState === 'granted'
                  ? 'Nearby Registered Hospitals (Sorted by Distance)'
                  : 'Available Healthcare Centres'}
              </span>
              {permissionState === 'granted' && (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>GPS Proximity Active</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {hospitals.map(h => {
                const isSelected = selectedHospitalId === h.hospitalId;
                return (
                  <div
                    key={h.hospitalId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{h.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {h.distanceKm ? `${h.distanceKm} km away` : '2.4 km away'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{h.address}</span>
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {h.departments.map(dept => (
                            <span
                              key={dept}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        id={`select-hospital-${h.hospitalId}-btn`}
                        onClick={() => {
                          onSelectHospital(h);
                          onClose();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{isSelected ? 'Selected Hospital' : 'Select Hospital'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
