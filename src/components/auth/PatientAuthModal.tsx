/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Patient Authentication Modal
 * Supports existing Patient Login (by Patient ID or Email) and New Patient Registration.
 * Automatically generates a distinct Patient ID (e.g. P001001) separate from Firebase UID.
 */

import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, HeartPulse, CheckCircle2, ArrowRight } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Patient } from '../../types';
import { APP_CONFIG } from '../../config/appConfig';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (patient: Patient) => void;
  onLaunchRaviDemo: () => void;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onLaunchRaviDemo,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('P001001'); // Preset to Ravi Kumar demo ID for instant convenience
  const [password, setPassword] = useState('pass123');
  const [errorMessage, setErrorMessage] = useState('');

  // New Patient registration form fields (Section 8)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState('en');
  const [bloodGroup, setBloodGroup] = useState('B+ve');
  const [allergies, setAllergies] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const patients = StorageService.getPatients();
    const idTrimmed = identifier.trim().toLowerCase();

    const matched = patients.find(
      p =>
        p.patientId.toLowerCase() === idTrimmed ||
        p.email.toLowerCase() === idTrimmed ||
        p.phone.includes(idTrimmed)
    );

    if (matched) {
      StorageService.setCurrentUser({
        role: 'patient',
        id: matched.patientId,
        name: matched.name,
      });
      onLoginSuccess(matched);
      onClose();
    } else {
      // Default to demo patient Ravi Kumar if not found
      const fallback = StorageService.getPatientById('P001001') || patients[0];
      StorageService.setCurrentUser({
        role: 'patient',
        id: fallback.patientId,
        name: fallback.name,
      });
      onLoginSuccess(fallback);
      onClose();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) {
      setErrorMessage('Please provide your name and age.');
      return;
    }

    const newPatientId = StorageService.generateNewPatientId();
    const newUid = `uid_pat_${Date.now()}`;

    const newPatient: Patient = {
      patientId: newPatientId,
      firebaseUid: newUid,
      name: name.trim(),
      age: parseInt(age, 10) || 30,
      gender,
      phone: phone || '+91 98000 00000',
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      preferredLanguage: preferredLang,
      bloodGroup,
      allergies: allergies ? allergies.split(',').map(s => s.trim()) : ['None reported'],
      existingConditions: existingConditions ? existingConditions.split(',').map(s => s.trim()) : ['None reported'],
      emergencyContact: {
        name: emergencyName || 'Family Member',
        relation: 'Relative',
        phone: emergencyPhone || '+91 98000 00001',
      },
      createdAt: new Date().toISOString(),
      status: 'Under Intake',
    };

    StorageService.savePatient(newPatient);
    StorageService.setCurrentUser({
      role: 'patient',
      id: newPatient.patientId,
      name: newPatient.name,
    });
    onLoginSuccess(newPatient);
    onClose();
  };

  return (
    <div
      id="patient-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isRegistering ? 'New Patient Registration' : 'Patient Portal Sign In'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRegistering ? 'Generate your unique Patient ID' : 'Access your cases and visit timeline'}
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

        {/* 1-Click Demo Patient Ravi Kumar Shortcut */}
        {!isRegistering && (
          <div className="p-3 mx-5 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">Quick Demo Patient:</span>
              <span className="text-emerald-800">Ravi Kumar (46M) • Patient ID: P001001</span>
            </div>
            <button
              id="patient-modal-demo-ravi-btn"
              onClick={() => {
                onLaunchRaviDemo();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shrink-0"
            >
              Sign In As Ravi
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="p-5">
          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID / Email / Phone
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="patient-login-id-input"
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. P001001 or ravi.kumar46@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Tip: Use demo ID <strong>P001001</strong> for Ravi Kumar
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="patient-login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                id="patient-login-submit-btn"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMessage('');
                  }}
                  className="text-xs text-emerald-800 hover:underline font-semibold"
                >
                  New Patient? Register here →
                </button>
              </div>
            </form>
          ) : (
            /* New Patient Registration Form */
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  id="reg-patient-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Suresh Gowda"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    id="reg-patient-age"
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    id="reg-patient-gender"
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    id="reg-patient-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    id="reg-patient-blood"
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="A+ve">A+ve</option>
                    <option value="B+ve">B+ve</option>
                    <option value="O+ve">O+ve</option>
                    <option value="AB+ve">AB+ve</option>
                    <option value="A-ve">A-ve</option>
                    <option value="B-ve">B-ve</option>
                    <option value="O-ve">O-ve</option>
                    <option value="AB-ve">AB-ve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Existing Conditions (if any)</label>
                <input
                  id="reg-patient-conditions"
                  type="text"
                  value={existingConditions}
                  onChange={e => setExistingConditions(e.target.value)}
                  placeholder="e.g. Hypertension, Asthma, Diabetes"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Known Drug Allergies (if any)</label>
                <input
                  id="reg-patient-allergies"
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <button
                id="reg-patient-submit-btn"
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors"
              >
                Complete Registration & Generate ID
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-600 hover:underline"
                >
                  Already registered? Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
