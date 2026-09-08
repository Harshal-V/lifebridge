/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Government Healthcare Portal Compliant Footer
 * Clinical safety boundaries notice, emergency helplines, and language directory.
 */

import React from 'react';
import { ShieldCheck, PhoneCall, AlertTriangle, HeartPulse, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { SupportedLanguage } from '../../i18n/translations';

interface FooterProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenAbout: () => void;
  highContrast?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  currentLanguage,
  onSelectLanguage,
  onOpenAbout,
  highContrast,
}) => {
  return (
    <footer
      id="main-app-footer"
      className={`border-t transition-colors mt-auto ${
        highContrast
          ? 'bg-black text-amber-200 border-amber-400'
          : 'bg-slate-900 text-slate-300 border-slate-800'
      }`}
    >
      {/* Clinical AI Boundary Callout Banner */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/50 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-100">
              Clinical Protocol Notice:
            </span>
            <span>
              Care starts by understanding your symptoms in your own words. Certified doctors make every diagnosis and treatment plan.
            </span>
          </div>
          <button
            onClick={onOpenAbout}
            className="text-emerald-300 hover:text-white underline underline-offset-2 shrink-0 font-medium"
          >
            Review Clinical AI Boundaries →
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Portal Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="LifeBridge Emblem Logo"
                className="h-12 sm:h-14 w-auto max-w-[56px] sm:max-w-[64px] object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-bold text-white tracking-tight">
                {APP_CONFIG.brandName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              {APP_CONFIG.subTagline}. Engineered for Indian district hospitals, community health centres, and outpatient departments to streamline triage, eliminate long intake queues, and assist certified medical officers.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
              <span>National Health Mission Aligned</span>
              <span>•</span>
              <span>GCP Cloud Infrastructure</span>
              <span>•</span>
              <span>10 Indian Languages</span>
            </div>
          </div>

          {/* Col 2: Emergency & Helplines */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency & Helplines
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center space-x-1.5 text-rose-300 font-semibold">
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                <span>National Emergency: 108 / 112</span>
              </li>
              <li>National Health Helpdesk: {APP_CONFIG.healthHelpdesk}</li>
              <li>Disaster Medical Support: 1070</li>
              <li>Women Helpline: 181</li>
            </ul>
          </div>

          {/* Col 3: Languages Supported */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Languages / भाषाएं
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {APP_CONFIG.languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => onSelectLanguage(l.code as SupportedLanguage)}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    currentLanguage === l.code
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Legal & Medical Disclaimer: All clinical case summaries generated by {APP_CONFIG.brandName} require mandatory clinician verification before treatment.
            </span>
          </div>
          <div className="shrink-0">
            © 2026 {APP_CONFIG.brandName} • Prototype for National Healthcare
          </div>
        </div>
      </div>
    </footer>
  );
};
