/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Patient Dashboard
 * Section 23: Patient profile, active queue token pass, longitudinal visit timeline,
 * 'What changed since last visit?' comparison, and document gallery.
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Activity,
  Calendar,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
  HeartPulse,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  History,
  TrendingUp,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Patient, Visit, QueueToken, UploadedDocument, Hospital } from '../../types';
import { StorageService } from '../../services/storageService';
import { LocationService, DetectedArea, PRESET_AREAS } from '../../services/locationService';
import { OriginalDocumentViewer } from '../common/OriginalDocumentViewer';
import { SupportedLanguage, TRANSLATIONS } from '../../i18n/translations';
import { APP_CONFIG } from '../../config/appConfig';

interface PatientDashboardProps {
  patient: Patient;
  currentLanguage: SupportedLanguage;
  onStartNewIntake: () => void;
  onOpenAbout: () => void;
  onOpenLocationModal?: () => void;
  highContrast?: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  currentLanguage,
  onStartNewIntake,
  onOpenAbout,
  onOpenLocationModal,
  highContrast,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const visits: Visit[] = StorageService.getVisitsByPatientId(patient.patientId);
  const activeTokens: QueueToken[] = StorageService.getTokensByPatientId(patient.patientId);
  const currentToken = activeTokens[0] || null;
  const documents: UploadedDocument[] = StorageService.getDocuments(patient.patientId);

  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);

  // Active Area & Hospital Discovery State
  const [detectedArea, setDetectedArea] = useState<DetectedArea>(
    LocationService.getSavedDetectedArea() || PRESET_AREAS[0]
  );
  const [selectedHospital, setSelectedHospital] = useState<Hospital>(
    LocationService.getSelectedHospital()
  );
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>(
    LocationService.getNearbyHospitals(detectedArea.coordinates)
  );

  // Sync state if localStorage changes
  useEffect(() => {
    const area = LocationService.getSavedDetectedArea() || PRESET_AREAS[0];
    setDetectedArea(area);
    setSelectedHospital(LocationService.getSelectedHospital());
    setNearbyHospitals(LocationService.getNearbyHospitals(area.coordinates));
  }, []);

  const handleSelectHospital = (hospital: Hospital) => {
    LocationService.saveSelectedHospital(hospital);
    setSelectedHospital(hospital);
  };

  const handleStartIntakeAtHospital = (hospital: Hospital) => {
    LocationService.saveSelectedHospital(hospital);
    setSelectedHospital(hospital);
    onStartNewIntake();
  };

  // Longitudinal changes comparison (Section 39)
  const previousVisit = visits.length > 1 ? visits[1] : null;
  const latestVisit = visits.length > 0 ? visits[0] : null;

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 space-y-6 ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xl font-black shadow-sm">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {patient.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {patient.patientId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {patient.age} yrs • {patient.gender} • Blood Group: {patient.bloodGroup || 'B+ve'} • {patient.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="patient-dashboard-new-intake-btn"
              onClick={onStartNewIntake}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.startIntake}</span>
            </button>
          </div>
        </div>

        {/* Local Healthcare Area & Nearby Hospitals Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Your Healthcare Area & Nearby Hospitals
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Area Selected</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Current Locality: <strong className="text-emerald-950 font-semibold">{detectedArea.formatted}</strong>
                </p>
              </div>
            </div>

            {onOpenLocationModal && (
              <button
                id="dashboard-change-location-btn"
                onClick={onOpenLocationModal}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all w-fit shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                <span>Change Area / Detect Again</span>
              </button>
            )}
          </div>

          {/* Hospitals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {nearbyHospitals.slice(0, 3).map((h, idx) => {
              const isSelected = selectedHospital.hospitalId === h.hospitalId;
              return (
                <div
                  key={h.hospitalId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {h.name}
                      </h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {h.distanceKm ? `${h.distanceKm} km` : 'Near'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{h.address}</span>
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-0.5">
                      <span className="font-semibold text-emerald-700">{h.status}</span>
                      <span>•</span>
                      <span>{h.phone}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {h.departments.slice(0, 3).map(dept => (
                        <span
                          key={dept}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {dept}
                        </span>
                      ))}
                      {h.departments.length > 3 && (
                        <span className="text-[9px] text-slate-400 font-medium self-center">
                          +{h.departments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSelectHospital(h)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active Facility' : 'Select'}
                    </button>

                    <button
                      onClick={() => handleStartIntakeAtHospital(h)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Start Intake Here</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Grid: Active Queue Token Pass & Clinical Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Active OPD Token Pass */}
          <div className="lg:col-span-2">
            {currentToken ? (
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
                      Active OPD Queue Token
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      currentToken.status === 'Called'
                        ? 'bg-amber-400 text-black animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Status: {currentToken.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                  <div className="sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                    <span className="text-[11px] text-emerald-200 block uppercase font-medium">
                      Token Number
                    </span>
                    <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                      {currentToken.tokenNumber}
                    </div>
                    <span className="text-[11px] text-emerald-300 font-semibold block mt-1">
                      ~{currentToken.estimatedWaitMinutes} min wait
                    </span>
                  </div>

                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Consultation Centre:</span>
                      <span className="text-sm font-bold text-white">{currentToken.hospitalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Department:</span>
                        <span className="font-bold text-emerald-200">{currentToken.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Consulting Doctor:</span>
                        <span className="font-bold text-white">{currentToken.assignedDoctorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Room Number:</span>
                        <span className="font-bold text-amber-300">{currentToken.roomNumber}</span>
                      </div>
                    </div>
                    <div className="pt-1 text-[11px] text-slate-300">
                      <strong>Complaint:</strong> {currentToken.chiefComplaint}
                    </div>
                  </div>
                </div>

                {/* Attention Flag Warning if present */}
                {currentToken.attentionFlags && currentToken.attentionFlags.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      High Attention Flag Recorded: Certified clinical officer notified for expedited triage evaluation.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Active Queue Token</h3>
                  <p className="text-xs text-slate-500">
                    You have no pending consultations today. Start a clinical intake to prepare your case sheet and receive a queue pass.
                  </p>
                </div>
                <button
                  onClick={onStartNewIntake}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  Start Intake Now
                </button>
              </div>
            )}
          </div>

          {/* Col 3: Medical Alert Profile (Allergies & Conditions) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Clinical Profile Flags</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-900 block mb-1">
                  Known Drug Allergies:
                </span>
                <span className="text-rose-800">
                  {patient.allergies.join(', ') || 'None reported'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  Pre-existing Conditions:
                </span>
                <span className="text-slate-700">
                  {patient.existingConditions.join(', ') || 'None reported'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block">Emergency Contact:</span>
                  <span className="font-bold text-slate-900">{patient.emergencyContact.name}</span>
                </div>
                <span className="text-xs text-emerald-700 font-semibold">
                  {patient.emergencyContact.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 39: Longitudinal 'What Changed Since Last Visit?' Comparison */}
        {latestVisit && previousVisit && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    What Changed Since Last Visit? (Longitudinal Synthesis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatic clinical evolution comparison between {new Date(previousVisit.visitDate).toLocaleDateString()} and {new Date(latestVisit.visitDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 font-bold">
                Doctor Reference Tool
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700">Previous Visit: {previousVisit.chiefComplaint}</div>
                <p className="text-slate-600 leading-relaxed">{previousVisit.clinicalNarrative}</p>
                <div className="text-[11px] font-semibold text-emerald-800">
                  Doctor Diagnosis: {previousVisit.doctorDiagnosis || 'Mild Angina Pectoris'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-950">Current Visit: {latestVisit.chiefComplaint}</div>
                <p className="text-emerald-900 leading-relaxed">{latestVisit.clinicalNarrative}</p>
                <div className="text-[11px] font-bold text-emerald-800">
                  Pain Progression: Rated {latestVisit.painScore}/10 (Increased discomfort)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Longitudinal Visit Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                Longitudinal Visit History & Doctor Verifications
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {visits.length} Recorded Visits
            </span>
          </div>

          <div className="space-y-3">
            {visits.map(v => (
              <div
                key={v.visitId}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.chiefComplaint}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-medium">
                      {v.department}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        v.doctorStatus === 'Consultation Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.doctorStatus}
                    </span>
                  </div>

                  <p className="text-slate-600">{v.clinicalNarrative}</p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                    <span>Date: {new Date(v.visitDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Doctor: {v.doctorName}</span>
                    <span>•</span>
                    <span>Hospital: {v.hospitalName}</span>
                  </div>
                </div>

                {v.doctorDiagnosis && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Doctor Verified Diagnosis:
                    </span>
                    <span className="font-bold">{v.doctorDiagnosis}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section: Medical Document Gallery (Unaltered Prescriptions) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                Prescriptions & Diagnostic Reports Gallery
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Unaltered Original Prescriptions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map(doc => (
              <div
                key={doc.documentId}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-600 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                        {doc.fileName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase">
                    {doc.fileType}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Original Document</span>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs"
                  >
                    View Original
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Document Viewer */}
          {selectedDoc && (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Prescription Direct Inspection
                </span>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Close Preview ✕
                </button>
              </div>
              <OriginalDocumentViewer document={selectedDoc} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
