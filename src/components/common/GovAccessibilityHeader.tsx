/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Government Portal Top Accessibility Bar
 * Provides official national healthcare styling, font-size adjustment (A-, A, A+),
 * high-contrast toggle, screen reader aids, and emergency helpline.
 */

import React from 'react';
import { Volume2, Eye, HelpCircle, PhoneCall, Mic } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { VoiceService } from '../../services/voiceService';

interface GovAccessibilityHeaderProps {
  fontSize: 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  onOpenAbout: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const GovAccessibilityHeader: React.FC<GovAccessibilityHeaderProps> = ({
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  onOpenAbout,
  onOpenVoiceAssistant,
}) => {
  return (
    <div
      id="gov-accessibility-topbar"
      className={`border-b text-xs transition-colors py-1.5 px-3 sm:px-6 ${
        highContrast
          ? 'bg-black text-amber-300 border-amber-400'
          : 'bg-slate-900 text-slate-200 border-slate-800'
      }`}
      role="region"
      aria-label="Accessibility & Government Portal Information"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Government / Health Department Affiliation Branding */}
        <div className="flex items-center space-x-2">
          {/* Subtle National Tricolor Indicator */}
          <div className="flex flex-col h-3.5 w-4 rounded-xs overflow-hidden shadow-xs border border-white/20">
            <span className="h-1/3 bg-[#FF9933] w-full block"></span>
            <span className="h-1/3 bg-white w-full block"></span>
            <span className="h-1/3 bg-[#138808] w-full block"></span>
          </div>
          <span className="font-semibold tracking-wide text-slate-100 hidden sm:inline">
            भारत सरकार | Government of India
          </span>
          <span className="text-slate-400 hidden md:inline">•</span>
          <span className="text-emerald-400 font-medium hidden md:inline">
            {APP_CONFIG.brandPrefix}
          </span>
        </div>

        {/* Accessibility Tools: Font Resizing, Contrast, Screen Reader announcement */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Emergency Alert Hotline */}
          <div className="flex items-center text-rose-300 font-medium mr-1">
            <PhoneCall className="w-3.5 h-3.5 mr-1 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">Emergency Helpline:</span>
            <span className="ml-1 font-bold text-white">{APP_CONFIG.emergencyNumber}</span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>

          {/* Font Size Adjusters */}
          <div className="flex items-center space-x-1" aria-label="Text Size Controls">
            <span className="text-slate-400 hidden lg:inline mr-1">Text Size:</span>
            <button
              id="font-size-small"
              onClick={() => setFontSize('normal')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                fontSize === 'normal'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Standard Font Size (A)"
              aria-label="Standard Font Size"
            >
              A-
            </button>
            <button
              id="font-size-medium"
              onClick={() => setFontSize('large')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                fontSize === 'large'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Medium Font Size (A+)"
              aria-label="Medium Font Size"
            >
              A
            </button>
            <button
              id="font-size-large"
              onClick={() => setFontSize('extra-large')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                fontSize === 'extra-large'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Large Accessible Font Size (A++)"
              aria-label="Extra Large Font Size"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            id="high-contrast-toggle"
            onClick={() => setHighContrast(!highContrast)}
            className={`flex items-center px-2 py-0.5 rounded transition-all font-medium ${
              highContrast
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle High Contrast Mode for Visual Accessibility"
            aria-pressed={highContrast}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Contrast</span>
          </button>

          {/* Screen Reader & Voice Assistant Guidance Button */}
          <button
            id="topbar-voice-assistant-btn"
            onClick={() => {
              VoiceService.playChime('start');
              if (onOpenVoiceAssistant) {
                onOpenVoiceAssistant();
              } else {
                VoiceService.speakText(
                  'Welcome to LifeBridge National Clinical Intake Portal. Voice assistant is active.',
                  'en'
                );
              }
            }}
            className="flex items-center px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-colors shadow-2xs font-semibold"
            title="Open Interactive LifeBridge Voice Assistant (आवाज़ सहायक)"
            aria-label="Open Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5 mr-1 text-emerald-300 animate-pulse" />
            <span>Voice Assistant</span>
            <span className="hidden lg:inline ml-1 text-[10px] text-emerald-300 font-normal">आवाज़</span>
          </button>

          {/* About / Clinical Safety Modal Link */}
          <button
            id="top-about-system-btn"
            onClick={onOpenAbout}
            className="flex items-center text-slate-300 hover:text-white underline underline-offset-2 ml-1"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-0.5 text-sky-400" />
            <span>AI Safety Protocol</span>
          </button>
        </div>
      </div>
    </div>
  );
};
