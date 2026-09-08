/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase-Conforming Storage Service Abstraction
 * Manages collections for patients, doctors, hospitals, visits, documents, tokens, and feedback.
 * Persists changes in localStorage so actions are fully functional and durable.
 */

import { Patient, Doctor, Hospital, Visit, UploadedDocument, QueueToken, PatientFeedback } from '../types';
import { DEMO_PATIENTS, DEMO_DOCTORS, DEMO_HOSPITALS, DEMO_VISITS, DEMO_DOCUMENTS, DEMO_TOKENS } from './mockData';

const STORAGE_KEYS = {
  PATIENTS: 'aarogyaflow_patients_v1',
  DOCTORS: 'aarogyaflow_doctors_v1',
  HOSPITALS: 'aarogyaflow_hospitals_v1',
  VISITS: 'aarogyaflow_visits_v1',
  DOCUMENTS: 'aarogyaflow_documents_v1',
  TOKENS: 'aarogyaflow_tokens_v1',
  FEEDBACK: 'aarogyaflow_feedback_v1',
  CURRENT_USER: 'aarogyaflow_auth_user_v1',
  SELECTED_LANG: 'aarogyaflow_lang_v1',
  ACCESSIBILITY: 'aarogyaflow_accessibility_v1',
};

function getCollection<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultData;
  }
}

function setCollection<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const StorageService = {
  // Hospitals
  getHospitals(): Hospital[] {
    return getCollection<Hospital>(STORAGE_KEYS.HOSPITALS, DEMO_HOSPITALS);
  },
  getHospitalById(id: string): Hospital | undefined {
    return this.getHospitals().find(h => h.hospitalId === id);
  },

  // Doctors
  getDoctors(): Doctor[] {
    return getCollection<Doctor>(STORAGE_KEYS.DOCTORS, DEMO_DOCTORS);
  },
  getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find(d => d.doctorId === id);
  },
  getDoctorsByDepartment(dept: string): Doctor[] {
    return this.getDoctors().filter(d => d.department.toLowerCase() === dept.toLowerCase());
  },

  // Patients
  getPatients(): Patient[] {
    return getCollection<Patient>(STORAGE_KEYS.PATIENTS, DEMO_PATIENTS);
  },
  getPatientById(patientId: string): Patient | undefined {
    return this.getPatients().find(p => p.patientId === patientId);
  },
  getPatientByFirebaseUid(uid: string): Patient | undefined {
    return this.getPatients().find(p => p.firebaseUid === uid);
  },
  savePatient(patient: Patient): void {
    const all = this.getPatients();
    const index = all.findIndex(p => p.patientId === patient.patientId);
    if (index >= 0) {
      all[index] = patient;
    } else {
      all.unshift(patient);
    }
    setCollection(STORAGE_KEYS.PATIENTS, all);
  },
  generateNewPatientId(): string {
    const all = this.getPatients();
    const nextNum = 1000 + all.length + 1;
    return `P00${nextNum}`;
  },

  // Visits
  getVisits(): Visit[] {
    return getCollection<Visit>(STORAGE_KEYS.VISITS, DEMO_VISITS);
  },
  getVisitById(visitId: string): Visit | undefined {
    return this.getVisits().find(v => v.visitId === visitId);
  },
  getVisitsByPatient(patientId: string): Visit[] {
    return this.getVisits().filter(v => v.patientId === patientId);
  },
  getVisitsByPatientId(patientId: string): Visit[] {
    return this.getVisitsByPatient(patientId);
  },
  getVisitsByDoctor(doctorId: string): Visit[] {
    return this.getVisits().filter(v => v.doctorId === doctorId);
  },
  saveVisit(visit: Visit): void {
    const all = this.getVisits();
    const index = all.findIndex(v => v.visitId === visit.visitId);
    if (index >= 0) {
      all[index] = visit;
    } else {
      all.unshift(visit);
    }
    setCollection(STORAGE_KEYS.VISITS, all);
  },
  createVisit(data: Partial<Visit>): Visit {
    const all = this.getVisits();
    const nextNum = all.length + 1;
    const visitId = `V00${nextNum < 10 ? '0' + nextNum : nextNum}`;
    const newVisit: Visit = {
      visitId,
      patientId: data.patientId || 'P001001',
      patientName: data.patientName || 'Patient',
      patientAge: data.patientAge || 40,
      patientGender: data.patientGender || 'Male',
      doctorId: data.doctorId || 'D001',
      doctorName: data.doctorName || 'Doctor',
      hospitalId: data.hospitalId || 'HOSP001',
      hospitalName: data.hospitalName || 'Aarogya Hospital',
      department: data.department || 'General Medicine',
      date: new Date().toISOString().split('T')[0],
      visitDate: data.visitDate || new Date().toISOString(),
      tokenNumber: data.queueTokenNumber || data.tokenNumber || 'T-01',
      chiefComplaint: data.chiefComplaint || 'Clinical intake',
      symptoms: data.symptoms || data.structuredSymptoms || [],
      structuredSymptoms: data.structuredSymptoms || [],
      painScore: data.painScore || 5,
      clinicalNarrative: data.clinicalNarrative,
      attentionFlags: data.attentionFlags || [],
      doctorStatus: data.doctorStatus || 'Pending Doctor Verification',
      status: 'Waiting',
      createdAt: new Date().toISOString(),
      uploadedDocuments: [],
      aiSummary: {
        chiefComplaint: data.chiefComplaint || 'Clinical intake',
        structuredSymptoms: data.structuredSymptoms || [],
        onset: 'Within 24-48 hours',
        painScore: data.painScore || 5,
        clinicalNarrative: data.clinicalNarrative || '',
        attentionFlags: data.attentionFlags || [],
        suggestedDepartment: data.department || 'General Medicine',
        departmentConfidence: 85,
        departmentReasoning: 'Clinical presentation match',
        statusLabel: 'AI Generated — Requires Doctor Verification',
        generatedAt: new Date().toISOString(),
      },
    };
    this.saveVisit(newVisit);
    return newVisit;
  },
  updateVisit(visitId: string, partial: Partial<Visit>): void {
    const all = this.getVisits();
    const index = all.findIndex(v => v.visitId === visitId);
    if (index >= 0) {
      all[index] = { ...all[index], ...partial };
      setCollection(STORAGE_KEYS.VISITS, all);
    }
  },
  generateNewVisitId(): string {
    const all = this.getVisits();
    const nextNum = all.length + 1;
    return `V00${nextNum < 10 ? '0' + nextNum : nextNum}`;
  },

  // Documents
  getDocuments(patientId?: string): UploadedDocument[] {
    const docs = getCollection<UploadedDocument>(STORAGE_KEYS.DOCUMENTS, DEMO_DOCUMENTS);
    if (patientId) {
      return docs.filter(d => d.patientId === patientId);
    }
    return docs;
  },
  getDocumentsByPatient(patientId: string): UploadedDocument[] {
    return this.getDocuments(patientId);
  },
  saveDocument(doc: UploadedDocument): void {
    const all = this.getDocuments();
    all.unshift(doc);
    setCollection(STORAGE_KEYS.DOCUMENTS, all);
  },

  // Tokens / Queue
  getTokens(): QueueToken[] {
    return getCollection<QueueToken>(STORAGE_KEYS.TOKENS, DEMO_TOKENS);
  },
  getTokensByPatientId(patientId: string): QueueToken[] {
    return this.getTokens().filter(t => t.patientId === patientId);
  },
  getTokensByDoctorId(doctorId: string): QueueToken[] {
    return this.getTokens().filter(t => t.doctorId === doctorId || t.assignedDoctorId === doctorId);
  },
  getActiveTokensForDoctor(doctorId: string): QueueToken[] {
    return this.getTokens().filter(t => (t.doctorId === doctorId || t.assignedDoctorId === doctorId) && t.status !== 'Completed');
  },
  saveToken(token: QueueToken): void {
    const all = this.getTokens();
    const index = all.findIndex(t => t.tokenId === token.tokenId);
    if (index >= 0) {
      all[index] = token;
    } else {
      all.unshift(token);
    }
    setCollection(STORAGE_KEYS.TOKENS, all);
  },
  updateTokenStatus(tokenId: string, status: QueueToken['status']): void {
    const all = this.getTokens();
    const index = all.findIndex(t => t.tokenId === tokenId);
    if (index >= 0) {
      all[index].status = status;
      setCollection(STORAGE_KEYS.TOKENS, all);
    }
  },
  generateQueueToken(data: {
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: 'Male' | 'Female' | 'Other';
    hospitalId: string;
    hospitalName: string;
    department: string;
    assignedDoctorId: string;
    assignedDoctorName: string;
    roomNumber: string;
    chiefComplaint: string;
    attentionFlags?: string[];
    priority?: 'Urgent' | 'Standard';
  }): QueueToken {
    const all = this.getTokens();
    const prefix = data.department.substring(0, 1).toUpperCase();
    const randomNum = Math.floor(20 + all.length + 1);
    const tokenNumber = `${prefix}-0${randomNum}`;
    const tokenId = `TOK_${Date.now()}`;

    const newToken: QueueToken = {
      tokenId,
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      department: data.department,
      doctorId: data.assignedDoctorId,
      doctorName: data.assignedDoctorName,
      assignedDoctorId: data.assignedDoctorId,
      assignedDoctorName: data.assignedDoctorName,
      roomNumber: data.roomNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      tokenNumber,
      chiefComplaint: data.chiefComplaint,
      attentionFlags: data.attentionFlags,
      attentionFlag: data.attentionFlags?.[0],
      priority: data.priority || 'Standard',
      status: 'Waiting',
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: data.priority === 'Urgent' ? 5 : 15,
    };

    this.saveToken(newToken);
    return newToken;
  },
  generateTokenNumber(dept: string): string {
    const prefix = dept.substring(0, 1).toUpperCase();
    const randomNum = Math.floor(20 + Math.random() * 30);
    return `${prefix}-0${randomNum}`;
  },

  // Feedback
  getFeedback(): PatientFeedback[] {
    return getCollection<PatientFeedback>(STORAGE_KEYS.FEEDBACK, []);
  },
  saveFeedback(fb: PatientFeedback): void {
    const all = this.getFeedback();
    all.unshift(fb);
    setCollection(STORAGE_KEYS.FEEDBACK, all);
  },

  // Current Logged In User State
  getCurrentUser(): { role: 'patient' | 'doctor' | 'staff'; id: string; name: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw) {
        return { role: 'patient', id: 'P001001', name: 'Ravi Kumar' };
      }
      return JSON.parse(raw);
    } catch {
      return { role: 'patient', id: 'P001001', name: 'Ravi Kumar' };
    }
  },
  setCurrentUser(user: { role: 'patient' | 'doctor' | 'staff'; id: string; name: string } | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  clearCurrentUser(): void {
    this.setCurrentUser(null);
  },

  // Language
  getSelectedLanguage(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_LANG) || 'en';
  },
  setSelectedLanguage(lang: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_LANG, lang);
  },

  // Reset to initial demo dataset if needed
  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(DEMO_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(DEMO_DOCTORS));
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(DEMO_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(DEMO_VISITS));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(DEMO_DOCUMENTS));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEMO_TOKENS));
  },
};
