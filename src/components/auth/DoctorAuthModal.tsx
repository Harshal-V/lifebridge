/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Doctor & Staff Authentication Modal
 * Supports role-based access for certified clinicians and hospital triage staff.
 */

import React, { useState } from 'react';
import { X, Stethoscope, Lock, Building2, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Doctor } from '../../types';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (doctor: Doctor) => void;
  onLaunchDoctorDemo: (doctorId: string) => void;
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onLaunchDoctorDemo,
}) => {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'staff'>('doctor');
  const [doctorId, setDoctorId] = useState('D001'); // Preset to Dr. Ananya Rao
  const [password, setPassword] = useState('clinician123');
  const [hospitalCode, setHospitalCode] = useState('HOSP001');

  if (!isOpen) return null;

  const doctors = StorageService.getDoctors();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = StorageService.getDoctorById(doctorId) || doctors[0];
    StorageService.setCurrentUser({
      role: selectedRole === 'doctor' ? 'doctor' : 'staff',
      id: doc.doctorId,
      name: doc.name,
    });
    onLoginSuccess(doc);
    onClose();
  };

  return (
    <div
      id="doctor-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Doctor & Clinical Staff Sign In
              </h3>
              <p className="text-xs text-slate-500">
                Hospital OPD & Triage Workspace Access
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

        {/* Role Selector Tabs */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRole('doctor')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'doctor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Medical Officer / Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'staff'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Triage / OPD Staff</span>
            </button>
          </div>
        </div>

        {/* 1-Click Clinician Quick Sign-in Selection */}
        <div className="p-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Clinician Account Selection:
          </div>
          <div className="space-y-2">
            {doctors.slice(0, 3).map(d => (
              <button
                key={d.doctorId}
                type="button"
                onClick={() => {
                  onLaunchDoctorDemo(d.doctorId);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  doctorId === d.doctorId
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{d.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {d.department} • {d.roomNumber}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Sign In
                </span>
              </button>
            ))}
          </div>

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Institution Code
              </label>
              <input
                type="text"
                value={hospitalCode}
                onChange={e => setHospitalCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doctor ID / Staff Credential
              </label>
              <select
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                {doctors.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.doctorId}: {d.name} ({d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital PIN / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
