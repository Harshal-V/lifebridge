/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Doctor OPD Workspace & Clinical Triage Interface
 * Implements Section 26-43:
 * Structured AI case sheet inspection, Red-flag triage alerts,
 * original prescription verification, doctor-authored diagnosis,
 * clinician prescription pad, and consultation finalization.
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  User,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  HeartPulse,
  Activity,
  Edit3,
  ShieldCheck,
  Plus,
  Printer,
  ChevronRight,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Doctor, QueueToken, Patient, Visit, UploadedDocument } from '../../types';
import { StorageService } from '../../services/storageService';
import { OriginalDocumentViewer } from '../common/OriginalDocumentViewer';
import { SupportedLanguage, TRANSLATIONS } from '../../i18n/translations';

interface DoctorDashboardProps {
  doctor: Doctor;
  currentLanguage: SupportedLanguage;
  onOpenAbout: () => void;
  highContrast?: boolean;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  currentLanguage,
  onOpenAbout,
  highContrast,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  // Queue tokens assigned to this doctor or department
  const [tokens, setTokens] = useState<QueueToken[]>(
    StorageService.getTokensByDoctorId(doctor.doctorId)
  );

  // Selected active patient case token (defaults to Ravi Kumar C-024)
  const [selectedToken, setSelectedToken] = useState<QueueToken | null>(
    tokens[0] || null
  );

  // Active patient data
  const activePatient: Patient | undefined = selectedToken
    ? StorageService.getPatientById(selectedToken.patientId)
    : undefined;

  // Active patient visits and documents
  const patientVisits: Visit[] = activePatient
    ? StorageService.getVisitsByPatientId(activePatient.patientId)
    : [];
  const patientDocs: UploadedDocument[] = activePatient
    ? StorageService.getDocuments(activePatient.patientId)
    : [];

  // Active visit record being worked on
  const currentVisit: Visit | undefined = patientVisits[0];

  // Clinician Editing States (Doctor owns final diagnosis & prescription)
  const [doctorDiagnosis, setDoctorDiagnosis] = useState<string>(
    currentVisit?.doctorDiagnosis || 'Acute Coronary Syndrome (Suspected) / Angina Pectoris'
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    currentVisit?.clinicalNarrative ||
      'Patient reports 24-hr severe retrosternal chest pain with left shoulder radiation and cold sweats. Urgent 12-lead ECG and Troponin-I ordered.'
  );
  const [prescribedMedications, setPrescribedMedications] = useState<string>(
    'Tab. Sorbitrate 5mg (Sublingual SOS), Tab. Aspirin 75mg, Tab. Atorvastatin 20mg'
  );
  const [isConsultationCompleted, setIsConsultationCompleted] = useState<boolean>(
    currentVisit?.doctorStatus === 'Consultation Completed'
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Original Document Viewer State
  const [inspectingDoc, setInspectingDoc] = useState<UploadedDocument | null>(null);

  // Handle Token Status Change (e.g. Call Patient, Complete)
  const handleCallPatient = (token: QueueToken) => {
    StorageService.updateTokenStatus(token.tokenId, 'Called');
    setTokens(StorageService.getTokensByDoctorId(doctor.doctorId));
    setSelectedToken({ ...token, status: 'Called' });
  };

  // Finalize & Sign Clinical Case
  const handleSaveConsultation = () => {
    if (!selectedToken || !currentVisit) return;

    StorageService.updateVisit(currentVisit.visitId, {
      doctorDiagnosis,
      clinicalNarrative: clinicalNotes,
      doctorStatus: 'Consultation Completed',
    });

    StorageService.updateTokenStatus(selectedToken.tokenId, 'Completed');
    setTokens(StorageService.getTokensByDoctorId(doctor.doctorId));
    setIsConsultationCompleted(true);
    setSaveSuccessMessage('Consultation finalized and saved to longitudinal patient record.');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 space-y-6 ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Clinician Profile & OPD Room Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-700 text-white flex items-center justify-center text-xl font-bold shadow-sm">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {doctor.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold">
                  {doctor.department}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {doctor.qualification} • {doctor.specialization} • Room: {doctor.roomNumber} • OPD Hours: {doctor.opdTimings}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">Medical Decision Protocol Active</span>
            </div>
          </div>
        </div>

        {/* Workspace Main 2-Column Grid: Queue Column & Case Sheet Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): OPD Patient Waiting Queue */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    OPD Consultation Queue ({tokens.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Live Tokens</span>
              </div>

              {/* Tokens List */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {tokens.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No waiting tokens in this OPD room.
                  </p>
                ) : (
                  tokens.map(tok => {
                    const isSelected = selectedToken?.tokenId === tok.tokenId;
                    return (
                      <div
                        key={tok.tokenId}
                        onClick={() => setSelectedToken(tok)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-slate-900">
                            Token: {tok.tokenNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              tok.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {tok.priority}
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="font-bold text-slate-800 block">
                            {tok.patientName} ({tok.patientAge}y / {tok.patientGender})
                          </span>
                          <span className="text-slate-500 text-[11px] line-clamp-1">
                            {tok.chiefComplaint}
                          </span>
                        </div>

                        {tok.attentionFlags && tok.attentionFlags.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Attention Flag Identified</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Status: {tok.status}</span>
                          {tok.status !== 'Completed' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleCallPatient(tok);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                            >
                              Call Token
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Structured Clinical Intake Case Sheet & Decision Station */}
          <div className="lg:col-span-8 space-y-6">
            {selectedToken && activePatient ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                {/* Header Case Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900">
                        Token {selectedToken.tokenNumber} — {activePatient.name}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {activePatient.patientId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {activePatient.age} yrs • {activePatient.gender} • Blood: {activePatient.bloodGroup || 'B+ve'} • Mobile: {activePatient.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Queue Status:</span>
                    <span className="text-xs font-bold text-emerald-800 uppercase">
                      {selectedToken.status}
                    </span>
                  </div>
                </div>

                {/* Section 33: High-Priority Red-Flag Alert Banner */}
                {selectedToken.attentionFlags && selectedToken.attentionFlags.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>CLINICAL ATTENTION FLAG (Requires Urgent Review)</span>
                    </div>
                    {selectedToken.attentionFlags.map((flag, idx) => (
                      <p key={idx} className="text-xs text-rose-800 pl-5">
                        {flag}
                      </p>
                    ))}
                  </div>
                )}

                {/* Structured Clinical Intake Summary (AI Generated — Requires Doctor Verification) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Structured AI Case Sheet</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      Requires Doctor Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block">Reported Chief Complaint:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedToken.chiefComplaint}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Self-Reported Pain Severity:</span>
                      <span className="text-sm font-bold text-rose-700">
                        {currentVisit?.painScore || 8}/10 (Severe Acute)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Clinical Narrative:</span>
                    <p className="text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-xl border border-slate-200 mt-1">
                      {currentVisit?.clinicalNarrative ||
                        `Patient presents with ${selectedToken.chiefComplaint}. History recorded via multilingual intake interview.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-slate-500 block">Allergies:</span>
                      <span className="font-bold text-rose-700">
                        {activePatient.allergies.join(', ') || 'None reported'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pre-existing Conditions:</span>
                      <span className="font-bold text-slate-800">
                        {activePatient.existingConditions.join(', ') || 'None reported'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 19: Original Prescription / Test Report Inspection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>Uploaded Patient Documents ({patientDocs.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Original Unaltered Records
                    </span>
                  </div>

                  {patientDocs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No previous documents uploaded by patient.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patientDocs.map(doc => (
                        <div
                          key={doc.documentId}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                              {doc.fileName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setInspectingDoc(doc)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                          >
                            Inspect Original
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Document Inspection Canvas if Opened */}
                  {inspectingDoc && (
                    <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          Original Prescription Inspection
                        </span>
                        <button
                          onClick={() => setInspectingDoc(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                        >
                          Close Inspection ✕
                        </button>
                      </div>
                      <OriginalDocumentViewer document={inspectingDoc} />
                    </div>
                  )}
                </div>

                {/* Section 34-37: Certified Doctor Decision Station */}
                <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-5 h-5 text-emerald-800" />
                      <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                        Certified Clinician Diagnosis & Orders Pad
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold">
                      Doctor-Authored Only
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Final Doctor Diagnosis *
                    </label>
                    <input
                      id="doctor-diagnosis-input"
                      type="text"
                      value={doctorDiagnosis}
                      onChange={e => setDoctorDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Coronary Syndrome (NSTEMI) / Unstable Angina"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-emerald-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Prescribed Medications (Clinician Authored)
                    </label>
                    <textarea
                      id="doctor-prescriptions-textarea"
                      rows={2}
                      value={prescribedMedications}
                      onChange={e => setPrescribedMedications(e.target.value)}
                      placeholder="e.g. Tab. Sorbitrate 5mg SOS sublingual, Tab. Aspirin 75mg 1 tab OD..."
                      className="w-full p-3 text-xs font-mono border border-emerald-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Doctor Consultation Notes & Follow-up Plan
                    </label>
                    <textarea
                      id="doctor-notes-textarea"
                      rows={2}
                      value={clinicalNotes}
                      onChange={e => setClinicalNotes(e.target.value)}
                      className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  {saveSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{saveSuccessMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Case Summary</span>
                    </button>

                    <button
                      id="doctor-finalize-case-btn"
                      type="button"
                      onClick={handleSaveConsultation}
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalize & Sign Case Consultation</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Select a Queue Token to Begin Consultation
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click any patient token from the OPD Queue on the left to review their structured AI intake case sheet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
