/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Patient Location Permissions & Nearby Hospital Discovery Modal
 * Triggered when a patient logs in. Requests Location, Microphone, and Notification permissions,
 * automatically detects and selects the patient's area/locality, and provides a sorted list of
 * nearby hospitals with distance calculations and department overviews.
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Mic,
  Bell,
  Building2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { Hospital, Patient } from '../../types';
import {
  LocationService,
  LocationCoordinates,
  DetectedArea,
  PermissionsStatus,
  PRESET_AREAS,
} from '../../services/locationService';

interface PatientLocationPermissionsModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onHospitalSelected: (hospital: Hospital, area: DetectedArea) => void;
  highContrast?: boolean;
}

export const PatientLocationPermissionsModal: React.FC<PatientLocationPermissionsModalProps> = ({
  isOpen,
  patient,
  onClose,
  onHospitalSelected,
  highContrast,
}) => {
  const [step, setStep] = useState<'permissions' | 'hospitals'>('permissions');
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [permissions, setPermissions] = useState<PermissionsStatus>({
    location: 'prompt',
    microphone: 'prompt',
    notifications: 'default',
  });

  const [userCoords, setUserCoords] = useState<LocationCoordinates | undefined>();
  const [detectedArea, setDetectedArea] = useState<DetectedArea>(
    LocationService.getSavedDetectedArea() || PRESET_AREAS[0]
  );
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    LocationService.getSelectedHospitalId()
  );

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing area if saved
      const savedArea = LocationService.getSavedDetectedArea();
      const coords = savedArea ? savedArea.coordinates : PRESET_AREAS[0].coordinates;
      setUserCoords(coords);
      if (savedArea) setDetectedArea(savedArea);

      const hospitals = LocationService.getNearbyHospitals(coords);
      setNearbyHospitals(hospitals);
      setSelectedHospitalId(LocationService.getSelectedHospitalId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-detect location & request permissions
  const handleGrantPermissions = async () => {
    setIsDetecting(true);
    setErrorMessage('');

    try {
      const result = await LocationService.requestAllPermissions();
      setPermissions(result.status);

      let coords = result.coords;
      if (!coords) {
        // Fallback to default Koramangala, Bengaluru if browser blocked
        coords = PRESET_AREAS[0].coordinates;
        setErrorMessage('Location permission was restricted. We selected the nearest regional center for you.');
      }

      setUserCoords(coords);

      // Automatically reverse-geocode the area name
      const area = await LocationService.reverseGeocode(coords);
      setDetectedArea(area);

      // Rank hospitals by distance
      const hospitals = LocationService.getNearbyHospitals(coords);
      setNearbyHospitals(hospitals);

      if (hospitals.length > 0) {
        setSelectedHospitalId(hospitals[0].hospitalId);
      }

      // Transition to nearby hospitals list
      setStep('hospitals');
    } catch (err: any) {
      console.error('Permission discovery error:', err);
      setErrorMessage(err.message || 'Could not automatically detect GPS. You can select your area manually.');
      // Still allow viewing hospitals
      const defaultCoords = PRESET_AREAS[0].coordinates;
      setUserCoords(defaultCoords);
      setDetectedArea(PRESET_AREAS[0]);
      setNearbyHospitals(LocationService.getNearbyHospitals(defaultCoords));
      setStep('hospitals');
    } finally {
      setIsDetecting(false);
    }
  };

  // Manual area selection handler
  const handleSelectArea = (area: DetectedArea) => {
    setDetectedArea(area);
    setUserCoords(area.coordinates);
    LocationService.saveDetectedArea(area);
    const hospitals = LocationService.getNearbyHospitals(area.coordinates);
    setNearbyHospitals(hospitals);
    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].hospitalId);
    }
    setStep('hospitals');
  };

  // Final confirmation
  const handleConfirmHospital = (hospital: Hospital) => {
    LocationService.saveSelectedHospital(hospital);
    LocationService.saveDetectedArea(detectedArea);
    LocationService.setPermissionsOnboarded(true);
    onHospitalSelected(hospital, detectedArea);
    onClose();
  };

  return (
    <div
      id="patient-location-permissions-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          highContrast ? 'bg-black text-white border-white' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="location-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                  {step === 'permissions' ? 'Hospital Discovery & Permissions' : 'Select Nearby Healthcare Facility'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Patient Intake
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Welcome, <strong className="text-slate-700">{patient.name}</strong> • Find the closest OPD centre
              </p>
            </div>
          </div>

          <button
            id="close-location-permissions-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Permissions Request Screen */}
          {step === 'permissions' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-emerald-950 block text-sm">
                    Automate Your OPD Intake Experience
                  </span>
                  <p className="text-emerald-800 leading-relaxed">
                    LifeBridge uses your device permissions strictly for clinical intake, local hospital triage routing, and real-time OPD token updates. We never track your ongoing location.
                  </p>
                </div>
              </div>

              {/* Individual Permission Feature Cards */}
              <div className="space-y-3">
                {/* 1. Location Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Area Location & GPS</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Required for Distance
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automatically detects your locality/district, calculates travel distance in kilometers, and lists the closest emergency and OPD centers.
                    </p>
                  </div>
                </div>

                {/* 2. Microphone Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800 shrink-0 mt-0.5">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Voice Assistant Microphone</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        10 Indian Languages
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Enables the interactive bilingual voice assistant (बोलकर बताएं) so you can speak your health symptoms freely in Hindi, Kannada, Tamil, or your native language.
                    </p>
                  </div>
                </div>

                {/* 3. Notification Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Queue & Token Alerts</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Live OPD Tracking
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Receive immediate alerts when your token number is called by the doctor or when your estimated wait time updates.
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  id="grant-all-permissions-btn"
                  onClick={handleGrantPermissions}
                  disabled={isDetecting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isDetecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Detecting Your Area & Requesting Permissions...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>Allow Permissions & Auto-Detect Location</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xs font-medium">Or pick an area manually</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Quick Area Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AREAS.slice(0, 6).map(area => (
                    <button
                      key={area.areaName}
                      onClick={() => handleSelectArea(area)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-700 transition-colors font-medium flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      <span>{area.city} ({area.areaName.split(',')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Nearby Hospitals Name List Screen */}
          {step === 'hospitals' && (
            <div className="space-y-5">
              {/* Selected / Detected Area Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>Area Automatically Selected</span>
                    </span>
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{detectedArea.formatted}</span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Showing verified hospitals nearest to your geographic vicinity
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('permissions')}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Area</span>
                  </button>
                </div>
              </div>

              {/* Quick Area Switcher Dropdown / Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Switch Target Healthcare District:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AREAS.map(area => {
                    const isCurrent = detectedArea.formatted === area.formatted;
                    return (
                      <button
                        key={area.areaName}
                        onClick={() => handleSelectArea(area)}
                        className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {area.city} - {area.areaName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List of Nearby Hospitals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Nearby Registered Hospitals ({nearbyHospitals.length})</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Sorted by Proximity</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {nearbyHospitals.map((hospital, idx) => {
                    const isSelected = selectedHospitalId === hospital.hospitalId;
                    return (
                      <div
                        key={hospital.hospitalId}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-slate-900">
                                {hospital.name}
                              </span>
                              {idx === 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Closest Centre
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                {hospital.status}
                              </span>
                              {hospital.emergencyAvailable && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                  Emergency 24/7
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{hospital.address}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                              <div className="flex items-center gap-1 font-bold text-emerald-800">
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{hospital.distanceKm ? `${hospital.distanceKm} km away` : 'Nearby'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{hospital.phone}</span>
                              </div>
                            </div>

                            {/* Available Departments */}
                            <div className="pt-2 flex flex-wrap gap-1">
                              {hospital.departments.map(dept => (
                                <span
                                  key={dept}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                                >
                                  {dept}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0">
                            <button
                              id={`select-hospital-${hospital.hospitalId}-action-btn`}
                              onClick={() => handleConfirmHospital(hospital)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              <span>{isSelected ? 'Confirm & Select' : 'Select Hospital'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Encrypted Healthcare Facility Registry</span>
          </span>

          <button
            onClick={() => {
              if (nearbyHospitals.length > 0) {
                const target = nearbyHospitals.find(h => h.hospitalId === selectedHospitalId) || nearbyHospitals[0];
                handleConfirmHospital(target);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Skip for now & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
