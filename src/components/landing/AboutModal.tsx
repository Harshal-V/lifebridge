/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * About Modal & AI Safety Guidelines
 * Details the purpose, workflow, and strict safety boundaries of AarogyaFlow.
 */

import React from 'react';
import { X, ShieldAlert, CheckCircle2, Stethoscope, HeartPulse, Brain, Lock } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="about-system-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="LifeBridge Emblem Logo"
              className="h-12 sm:h-14 w-auto max-w-[52px] sm:max-w-[60px] object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 id="about-modal-title" className="text-lg font-bold text-slate-900">
                About {APP_CONFIG.brandName}
              </h2>
              <p className="text-xs text-slate-500">
                Clinical Intake & Triage Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700">
          {/* Core Philosophy Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="font-bold text-base text-emerald-900 mb-1">
              Our Guiding Principle
            </div>
            <div className="text-lg font-extrabold text-emerald-800">
              &quot;Care begins by listening. Doctors who have time for you.&quot;
            </div>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Built to bring human warmth, dignity, and efficiency to healthcare. We help you share how you feel in your native language, giving doctors the complete story so they can focus on attentive, personalized care.
            </p>
          </div>

          {/* Why AarogyaFlow Exists */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-700" />
              Why It Exists
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Reduce Doctor Administrative Burden:</strong> Doctors in crowded Indian OPDs spend valuable minutes typing history. AI prepares structured intake so clinicians can focus on physical examination and treatment.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Multilingual Accessibility:</strong> Allows patients to speak or write in 10 Indian languages (Hindi, Kannada, Telugu, Tamil, Malayalam, Bengali, etc.) and bridges language barriers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Red-Flag Symptom Detection:</strong> Flags high-acuity indicators (such as chest pain + breathlessness) for rapid clinician attention.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Preserve Original Records:</strong> Keeps original prescriptions and lab reports unchanged without making risky OCR assumptions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Longitudinal Visit Comparison:</strong> Automatically answers &quot;What changed since last visit?&quot; for returning patients.</span>
              </li>
            </ul>
          </div>

          {/* Strict Clinical Safety Boundaries */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <h3 className="text-sm font-bold text-amber-950 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Strict Safety Boundaries
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-rose-700">What AI MUST NEVER do:</div>
                <div className="text-rose-900">• Diagnose diseases</div>
                <div className="text-rose-900">• Prescribe medicines</div>
                <div className="text-rose-900">• Recommend treatments</div>
                <div className="text-rose-900">• Replace doctors</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-emerald-700">What AI is authorized to do:</div>
                <div className="text-emerald-900">• Conduct clinical intake interview</div>
                <div className="text-emerald-900">• Structure reported symptoms</div>
                <div className="text-emerald-900">• Highlight potential red flags</div>
                <div className="text-emerald-900">• Recommend department for staff confirmation</div>
              </div>
            </div>
          </div>

          {/* Data Provenance & Privacy */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Data Provenance Guarantee:</span>
              <p className="text-slate-600 mt-0.5">
                Every record distinguishes between <em>Patient Reported</em>, <em>AI Generated</em>, and <em>Doctor Verified</em> data. Original patient words and uploads are preserved permanently.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
