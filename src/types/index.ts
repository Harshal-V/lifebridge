/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Core Data Models & TypeScript Interfaces
 */

export type UserRole = 'patient' | 'doctor' | 'staff';

export interface Patient {
  patientId: string; // e.g. "P001001" - separate from Firebase UID
  firebaseUid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  preferredLanguage: string;
  bloodGroup: string;
  allergies: string[];
  existingConditions: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  createdAt: string;
  status: 'Active' | 'Under Intake' | 'Consultation Complete';
}

export interface Doctor {
  doctorId: string; // e.g. "D001"
  firebaseUid: string;
  name: string;
  qualification: string;
  specialization: string;
  department: string;
  hospitalId: string;
  phone: string;
  email: string;
  languages: string[];
  availability: 'Available' | 'In Consultation' | 'On Break' | 'Off Duty';
  currentStatus: string;
  roomNumber: string;
  opdTimings?: string;
  active: boolean;
  avatarUrl?: string;
}

export interface Hospital {
  hospitalId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  departments: string[];
  phone: string;
  emergencyAvailable: boolean;
  status: 'Open 24/7' | 'OPD Active' | 'Closed';
  distanceKm?: number;
}

export interface UploadedDocument {
  documentId: string;
  patientId: string;
  visitId?: string;
  documentType?: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Scan Report' | 'Other';
  fileType?: string;
  fileName: string;
  fileURL: string;
  thumbnailURL?: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
  originalPrescriptionRequiredInspection?: boolean;
  provenance?: string;
}

export interface InterviewTurn {
  id?: string;
  turnId?: string;
  question?: string;
  answer?: string;
  speaker?: 'patient' | 'ai';
  text?: string;
  language?: string;
  timestamp: string;
  mode?: 'voice' | 'text' | 'guided';
  isAudioPlayed?: boolean;
  provenance?: string;
}

export interface StructuredAiCaseSheet {
  chiefComplaint: string;
  structuredSymptoms: string[];
  onset: string;
  painScore: number;
  clinicalNarrative: string;
  attentionFlags: string[];
  suggestedDepartment: string;
  departmentConfidence: number;
  departmentReasoning: string;
  suggestedDoctorId?: string;
  suggestedDoctorName?: string;
  statusLabel: string;
  generatedAt: string;
}

export interface VisitComparison {
  sincePreviousVisit: string[];
  painComparison: string;
  newSymptoms: string[];
  resolvedSymptoms: string[];
  allergyChange: string;
}

export interface Visit {
  visitId: string; // e.g. "V0001"
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  date: string;
  visitDate?: string;
  tokenNumber: string; // e.g. "C-024"
  chiefComplaint: string;
  symptoms: string[];
  structuredSymptoms?: string[];
  painScore: number;
  patientResponses?: InterviewTurn[];
  aiSummary?: StructuredAiCaseSheet;
  aiRedFlags?: string[];
  attentionFlags?: string[];
  clinicalNarrative?: string;
  doctorNotes?: string;
  doctorAssessment?: string;
  doctorDiagnosis?: string;
  doctorStatus?: string;
  queueTokenNumber?: string;
  prescription?: {
    medicines: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    advice: string;
  };
  referral?: {
    toDepartment: string;
    toDoctorId?: string;
    toDoctorName?: string;
    reason: string;
    referredAt: string;
  };
  comparisonWithPrevious?: VisitComparison;
  uploadedDocuments?: UploadedDocument[];
  status: 'Waiting' | 'In Consultation' | 'Verified by Doctor' | 'Completed' | 'Referred';
  createdAt: string;
  verifiedAt?: string;
}

export interface QueueToken {
  tokenId: string;
  hospitalId: string;
  hospitalName?: string;
  department: string;
  doctorId: string;
  doctorName: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  roomNumber?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  tokenNumber: string;
  chiefComplaint: string;
  attentionFlag?: string;
  attentionFlags?: string[];
  priority?: 'Urgent' | 'Standard';
  status: 'Waiting' | 'Called' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
  estimatedWaitMinutes: number;
  visitId?: string;
}

export interface PatientFeedback {
  feedbackId: string;
  patientId: string;
  patientName: string;
  type: 'Experience' | 'Technical Issue' | 'Complaint' | 'Suggestion';
  message: string;
  rating: number;
  createdAt: string;
  status: 'Received' | 'Reviewed';
}

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  screenReaderAnnouncement: string;
  speechRate: number;
}
