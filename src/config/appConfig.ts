/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Application Configuration
 * Easily change the branding name, tagline, logos, feature flags, and supported languages here.
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
}

export const APP_CONFIG = {
  // Brand Configuration (Centralized so name can be replaced in one place)
  brandName: 'LifeBridge',
  brandPrefix: 'National Health Mission Aligned',
  tagline: 'Care begins by listening to you. We are here to help you heal.',
  subTagline: 'Compassionate Patient Intake & Health Navigation for Indian Hospitals',
  portalName: 'National Clinical Intake & Triage Portal',
  ministryName: 'Government of India Healthcare Infrastructure Prototype',
  
  // Emergency Helpline Contact
  emergencyNumber: '108 / 112',
  healthHelpdesk: '1800-11-4477 (Toll Free)',
  
  // Supported Indian Languages (10 major languages)
  languages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  ] as LanguageConfig[],

  // Primary demo hospital
  defaultHospitalName: 'LifeBridge Multispeciality Hospital',

  // Feature Flags
  features: {
    voiceIntake: true,
    serverSideGemini: true,
    speechSynthesis: true,
    originalDocStorage: true,
    redFlagAlerts: true,
    visitComparison: true,
    doctorReferral: true,
  },

  // AI & Clinical Safety Notice
  safetyDisclaimer: 'This system is for clinical intake assistance only. It does not diagnose diseases, prescribe medication, or replace healthcare practitioners. Final clinical decisions are strictly made by certified doctors.',
};
