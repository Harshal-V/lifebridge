/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AarogyaFlow - National AI Clinical Intake & Triage Portal
 * Core Principle: "Care begins by listening to you. We are here to help you heal."
 * Prominently placed top accessibility search bar and 10-language selector.
 */

import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { GovAccessibilityHeader } from './components/common/GovAccessibilityHeader';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { AboutModal } from './components/landing/AboutModal';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { CaseIntakeWizard } from './components/patient/CaseIntakeWizard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { PatientAuthModal } from './components/auth/PatientAuthModal';
import { DoctorAuthModal } from './components/auth/DoctorAuthModal';
import { PatientLocationPermissionsModal } from './components/patient/PatientLocationPermissionsModal';
import { AarogyaVoiceAssistant } from './components/common/AarogyaVoiceAssistant';
import { SupportedLanguage } from './i18n/translations';
import { UserRole, Patient, Doctor, QueueToken } from './types';
import { StorageService } from './services/storageService';
import { LocationService } from './services/locationService';

export default function App() {
  // Application View Routing
  const [currentView, setCurrentView] = useState<
    'landing' | 'patient-dashboard' | 'doctor-dashboard' | 'case-intake' | 'about'
  >('landing');

  // Accessibility State (Font Scaling & High Contrast)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Multilingual State (Supports 10 Indian Languages)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Authentication & Active Session State
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; id: string; name: string } | null>(null);

  // Active Patient & Doctor Context
  const [activePatient, setActivePatient] = useState<Patient>(
    StorageService.getPatientById('P001001') || StorageService.getPatients()[0]
  );
  const [activeDoctor, setActiveDoctor] = useState<Doctor>(
    StorageService.getDoctorById('D001') || StorageService.getDoctors()[0]
  );

  // Modals State
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isPatientAuthOpen, setIsPatientAuthOpen] = useState<boolean>(false);
  const [isDoctorAuthOpen, setIsDoctorAuthOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isLocationPermissionsOpen, setIsLocationPermissionsOpen] = useState<boolean>(false);

  // Intake pre-fill symptom state (from search bar quick jumps)
  const [initialSymptomForIntake, setInitialSymptomForIntake] = useState<string>('');

  // Synchronize stored user session on initial boot
  useEffect(() => {
    const savedUser = StorageService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setCurrentRole(savedUser.role);
      if (savedUser.role === 'patient') {
        const p = StorageService.getPatientById(savedUser.id);
        if (p) {
          setActivePatient(p);
          if (!LocationService.isPermissionsOnboarded()) {
            setIsLocationPermissionsOpen(true);
          }
        }
      } else if (savedUser.role === 'doctor') {
        const d = StorageService.getDoctorById(savedUser.id);
        if (d) setActiveDoctor(d);
      }
    }
  }, []);

  // Quick Demo Account Switchers (Instant 1-Click Evaluation)
  const handleLaunchRaviPatientDemo = () => {
    const ravi = StorageService.getPatientById('P001001') || StorageService.getPatients()[0];
    setActivePatient(ravi);
    setCurrentRole('patient');
    setCurrentUser({ role: 'patient', id: ravi.patientId, name: ravi.name });
    StorageService.setCurrentUser({ role: 'patient', id: ravi.patientId, name: ravi.name });
    setCurrentView('patient-dashboard');
    setIsLocationPermissionsOpen(true);
  };

  const handleLaunchAnanyaDoctorDemo = (doctorId = 'D001') => {
    const doc = StorageService.getDoctorById(doctorId) || StorageService.getDoctors()[0];
    setActiveDoctor(doc);
    setCurrentRole('doctor');
    setCurrentUser({ role: 'doctor', id: doc.doctorId, name: doc.name });
    StorageService.setCurrentUser({ role: 'doctor', id: doc.doctorId, name: doc.name });
    setCurrentView('doctor-dashboard');
  };

  const handleLaunchStaffDemo = () => {
    const doc = StorageService.getDoctors()[0];
    setActiveDoctor(doc);
    setCurrentRole('staff');
    setCurrentUser({ role: 'staff', id: 'STAFF01', name: 'OPD Triage Staff' });
    StorageService.setCurrentUser({ role: 'staff', id: 'STAFF01', name: 'OPD Triage Staff' });
    setCurrentView('doctor-dashboard');
  };

  // Logout handler
  const handleLogout = () => {
    StorageService.clearCurrentUser();
    setCurrentUser(null);
    setCurrentRole(null);
    setCurrentView('landing');
  };

  return (
    <div
      id="aarogyaflow-app-root"
      className={`min-h-screen flex flex-col transition-all font-sans ${
        fontSize === 'large'
          ? 'text-base'
          : fontSize === 'extra-large'
          ? 'text-lg'
          : 'text-sm'
      } ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* 1. Official Government Healthcare Portal Accessibility Header */}
      <GovAccessibilityHeader
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
      />

      {/* 2. Top Header & 10-Language Switcher */}
      <Navbar
        currentRole={currentRole}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        onSelectLanguage={lang => setCurrentLanguage(lang)}
        onNavigate={view => {
          if (view === 'about') {
            setIsAboutModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onOpenLogin={role => {
          if (role === 'patient') setIsPatientAuthOpen(true);
          else setIsDoctorAuthOpen(true);
        }}
        onLogout={handleLogout}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        highContrast={highContrast}
      />

      {/* 3. Main Dynamic Application Views */}
      <main className="flex-1">
        {/* Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            currentLanguage={currentLanguage}
            onSelectRole={role => {
              if (role === 'patient') setIsPatientAuthOpen(true);
              else setIsDoctorAuthOpen(true);
            }}
            onLaunchDemoPatient={handleLaunchRaviPatientDemo}
            onLaunchDemoDoctor={() => handleLaunchAnanyaDoctorDemo('D001')}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onStartIntakeDirect={() => {
              handleLaunchRaviPatientDemo();
              setCurrentView('case-intake');
            }}
            highContrast={highContrast}
          />
        )}

        {/* Patient Dashboard */}
        {currentView === 'patient-dashboard' && (
          <PatientDashboard
            patient={activePatient}
            currentLanguage={currentLanguage}
            onStartNewIntake={() => {
              setInitialSymptomForIntake('');
              setCurrentView('case-intake');
            }}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onOpenLocationModal={() => setIsLocationPermissionsOpen(true)}
            highContrast={highContrast}
          />
        )}

        {/* Doctor & Staff OPD Workspace */}
        {currentView === 'doctor-dashboard' && (
          <DoctorDashboard
            doctor={activeDoctor}
            currentLanguage={currentLanguage}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            highContrast={highContrast}
          />
        )}

        {/* Clinical Intake & Case Taking Wizard */}
        {currentView === 'case-intake' && (
          <CaseIntakeWizard
            currentPatient={activePatient}
            currentLanguage={currentLanguage}
            onLanguageChange={lang => setCurrentLanguage(lang)}
            initialSymptom={initialSymptomForIntake}
            onIntakeCompleted={(_token: QueueToken) => {
              setCurrentView('patient-dashboard');
            }}
            onCancel={() => {
              setCurrentView(currentUser?.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
            }}
            highContrast={highContrast}
          />
        )}
      </main>

      {/* 4. Compliant Government Healthcare Portal Footer */}
      <Footer
        currentLanguage={currentLanguage}
        onSelectLanguage={lang => setCurrentLanguage(lang)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        highContrast={highContrast}
      />

      {/* Floating Voice Assistant Trigger (Omnipresent 1-Tap Access) */}
      <button
        id="floating-voice-assistant-trigger-btn"
        onClick={() => setIsVoiceAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl hover:shadow-2xl border-2 border-white transition-all transform hover:scale-105 active:scale-95 group"
        title="Open LifeBridge Voice Assistant (आवाज़ सहायक)"
        aria-label="Open LifeBridge Voice Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-wide leading-tight">आवाज़ सहायक</span>
          <span className="text-[10px] font-semibold text-emerald-200 leading-none hidden sm:block">Voice Assistant</span>
        </div>
      </button>

      {/* 6. Modals */}
      <AarogyaVoiceAssistant
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        onNavigateToIntake={(symptom) => {
          if (symptom) setInitialSymptomForIntake(symptom);
          setCurrentView('case-intake');
        }}
        onNavigateToDashboard={() => {
          if (currentUser?.role === 'doctor') {
            setCurrentView('doctor-dashboard');
          } else {
            setCurrentView('patient-dashboard');
          }
        }}
        highContrast={highContrast}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <PatientLocationPermissionsModal
        isOpen={isLocationPermissionsOpen}
        patient={activePatient}
        onClose={() => setIsLocationPermissionsOpen(false)}
        onHospitalSelected={(_hospital, _area) => {
          setIsLocationPermissionsOpen(false);
        }}
        highContrast={highContrast}
      />

      <PatientAuthModal
        isOpen={isPatientAuthOpen}
        onClose={() => setIsPatientAuthOpen(false)}
        onLoginSuccess={p => {
          setActivePatient(p);
          setCurrentRole('patient');
          setCurrentUser({ role: 'patient', id: p.patientId, name: p.name });
          setCurrentView('patient-dashboard');
          setIsLocationPermissionsOpen(true);
        }}
        onLaunchRaviDemo={handleLaunchRaviPatientDemo}
      />

      <DoctorAuthModal
        isOpen={isDoctorAuthOpen}
        onClose={() => setIsDoctorAuthOpen(false)}
        onLoginSuccess={d => {
          setActiveDoctor(d);
          setCurrentRole('doctor');
          setCurrentUser({ role: 'doctor', id: d.doctorId, name: d.name });
          setCurrentView('doctor-dashboard');
        }}
        onLaunchDoctorDemo={handleLaunchAnanyaDoctorDemo}
      />
    </div>
  );
}
