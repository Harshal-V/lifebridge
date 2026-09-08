/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Floating Role Demo Switcher
 * Allows instant 1-click toggling between Patient (Ravi Kumar), Doctor (Dr. Ananya Rao), and Staff
 * for rapid judging and evaluation of clinical workflows.
 */

import React from 'react';
import { User, Stethoscope, UserCheck, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleDemoSwitcherProps {
  currentRole: UserRole | null;
  onSwitchToPatientRavi: () => void;
  onSwitchToDoctorAnanya: () => void;
  onSwitchToStaff: () => void;
}

export const RoleDemoSwitcher: React.FC<RoleDemoSwitcherProps> = ({
  currentRole,
  onSwitchToPatientRavi,
  onSwitchToDoctorAnanya,
  onSwitchToStaff,
}) => {
  return (
    <div
      id="floating-role-demo-switcher"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 bg-slate-900/95 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center space-x-2"
      role="region"
      aria-label="Demo Role Switcher"
    >
      <div className="hidden md:flex items-center space-x-1.5 pl-2 pr-1 text-slate-300 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Demo Roles:</span>
      </div>

      {/* Switch to Ravi Kumar */}
      <button
        id="demo-switcher-ravi-btn"
        onClick={onSwitchToPatientRavi}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          currentRole === 'patient'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        title="Switch to Demo Patient Ravi Kumar (Chest Pain Intake Case)"
      >
        <User className="w-3.5 h-3.5" />
        <span>Patient (Ravi)</span>
      </button>

      {/* Switch to Dr. Ananya Rao */}
      <button
        id="demo-switcher-doctor-btn"
        onClick={onSwitchToDoctorAnanya}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          currentRole === 'doctor'
            ? 'bg-sky-600 text-white shadow-xs'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        title="Switch to Cardiologist Dr. Ananya Rao Workspace"
      >
        <Stethoscope className="w-3.5 h-3.5" />
        <span>Doctor (Ananya)</span>
      </button>

      {/* Switch to Staff */}
      <button
        id="demo-switcher-staff-btn"
        onClick={onSwitchToStaff}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          currentRole === 'staff'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        title="Switch to OPD Triage Staff Queue"
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Staff / Queue</span>
      </button>
    </div>
  );
};
