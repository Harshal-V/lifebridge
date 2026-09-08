/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AarogyaFlow Official Healthcare Landing Page
 * Designed for national health intake: high trust, accessible, multilingual, generous whitespace.
 */

import React from 'react';
import {
  Activity,
  User,
  Stethoscope,
  ShieldCheck,
  Languages,
  Clock,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Building2,
  Mic,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { SupportedLanguage, TRANSLATIONS } from '../../i18n/translations';

interface LandingPageProps {
  currentLanguage: SupportedLanguage;
  onSelectRole: (role: 'patient' | 'doctor') => void;
  onLaunchDemoPatient?: () => void;
  onLaunchDemoDoctor?: () => void;
  onOpenAbout: () => void;
  onStartIntakeDirect: () => void;
  highContrast?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentLanguage,
  onSelectRole,
  onOpenAbout,
  onStartIntakeDirect,
  highContrast,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  return (
    <div className={`min-h-screen ${highContrast ? 'bg-black text-white' : 'bg-white text-slate-900'}`}>
      {/* Hero Section with 70% Transparent Healthcare Background Scene */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100">
        {/* Background Image: Compassionate Consultation scene with 70% transparency (30% opacity) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/hero-bg.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-30"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette to blend smoothly and guarantee text contrast */}
          <div className={`absolute inset-0 ${highContrast ? 'bg-gradient-to-b from-black/85 via-black/75 to-black' : 'bg-gradient-to-b from-white/85 via-white/70 to-white/95'}`} />
        </div>

        {/* Subtle background healthcare ambient accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center space-y-7">
          {/* National Portal Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-50/90 backdrop-blur-xs border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>National Clinical Intake System • Indian Healthcare Aligned</span>
          </div>

          {/* Tagline & Headline */}
          <div className="space-y-4 max-w-3xl">
            {(() => {
              const hasDanda = t.heroTagline.includes('।');
              const parts = t.heroTagline
                .split(/[.।]/)
                .map(s => s.trim())
                .filter(Boolean);
              const line1 = parts[0] || 'Care begins by listening to you';
              const line2 = parts[1] || 'We are here to help you heal';
              const punc = hasDanda ? '।' : '.';

              return (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
                  <span>{line1}{punc}</span>
                  <br />
                  <span className="text-emerald-700">
                    {line2}{line2.endsWith(punc) ? '' : punc}
                  </span>
                </h1>
              );
            })()}
            <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {t.heroSubtext}
            </p>
          </div>

          {/* Primary Role & Intake CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full max-w-md">
            <button
              id="landing-hero-patient-btn"
              onClick={() => onSelectRole('patient')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <User className="w-5 h-5" />
              <span>{t.imPatient}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="landing-hero-doctor-btn"
              onClick={() => onSelectRole('doctor')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/95 hover:bg-slate-50 text-slate-900 font-bold text-sm sm:text-base border border-slate-300 shadow-xs hover:border-slate-400 transition-all flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-5 h-5 text-emerald-700" />
              <span>{t.imDoctor}</span>
            </button>
          </div>

          {/* Direct Clinical Interview CTA */}
          {onStartIntakeDirect && (
            <button
              id="landing-start-intake-direct-btn"
              onClick={onStartIntakeDirect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>Experience Multilingual Clinical Intake Interview</span>
            </button>
          )}

          {/* Safety Assurance Callout */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero AI Prescriptions • Certified Doctor-Authored Diagnoses Only</span>
          </div>
        </div>
      </section>

      {/* How LifeBridge Operates: 4-Step Safety Flow */}
      <section className="py-14 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t.howItWorksTitle}
            </h2>
            <p className="text-sm text-slate-600">
              A transparent, safe 4-stage pipeline that keeps clinical responsibility entirely with certified medical officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.step1}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.step2}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.step3}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.step3Desc}</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900">{t.step4}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.step4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Strict Clinical Safety Boundaries Matrix */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4" />
                <span>Non-Negotiable Healthcare Safeguards</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t.safetyTitle}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t.safetyBoundaryNotice} {APP_CONFIG.safetyDisclaimer}
              </p>
              <div className="pt-2">
                <button
                  id="safety-protocol-details-btn"
                  onClick={onOpenAbout}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Read Full Clinical AI Protocols</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
