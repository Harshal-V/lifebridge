/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Government Healthcare Portal Header & Navigation Bar
 * Integrates prominent accessibility search, language switcher, brand identity, and role navigation.
 */

import React, { useState } from 'react';
import {
  Menu,
  X,
  User,
  Stethoscope,
  ShieldCheck,
  Building2,
  LogOut,
  Sparkles,
  Mic,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { TopLanguageSelector } from './TopLanguageSelector';
import { SupportedLanguage, TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';

interface NavbarProps {
  currentRole: UserRole | null;
  currentUser: { role: UserRole; id: string; name: string } | null;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onNavigate: (view: 'landing' | 'patient-dashboard' | 'doctor-dashboard' | 'case-intake' | 'about') => void;
  onOpenLogin: (role: 'patient' | 'doctor') => void;
  onLogout: () => void;
  onOpenVoiceAssistant?: () => void;
  highContrast?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUser,
  currentLanguage,
  onSelectLanguage,
  onNavigate,
  onOpenLogin,
  onLogout,
  onOpenVoiceAssistant,
  highContrast,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  return (
    <header
      id="main-app-navbar"
      className={`border-b sticky top-0 z-40 transition-colors ${
        highContrast
          ? 'bg-black border-amber-400 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Primary Brand & Accessibility Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Logo & Portal Identity */}
          <div
            id="brand-logo-container"
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onNavigate('landing')}
            aria-label="LifeBridge National Clinical Portal - Return to Home"
          >
            <img
              src="/logo.png"
              alt="LifeBridge Emblem Logo"
              className="h-14 sm:h-16 w-auto max-w-[64px] sm:max-w-[76px] object-contain drop-shadow-xs group-hover:scale-105 transition-transform shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {APP_CONFIG.brandName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline">
                  Clinical Intake
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Care begins by listening to you.
              </p>
            </div>
          </div>

          {/* Top Actions: Voice Assistant + Language Selector + User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick Voice Assistant Trigger Button */}
            {onOpenVoiceAssistant && (
              <button
                id="navbar-voice-assistant-btn"
                type="button"
                onClick={onOpenVoiceAssistant}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs font-semibold text-xs"
                title="LifeBridge Voice Assistant (आवाज़ सहायक)"
                aria-label="Open Voice Assistant"
              >
                <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
                <span className="hidden sm:inline">Voice</span>
              </button>
            )}

            {/* Prominent Language Selector */}
            <TopLanguageSelector
              currentLanguage={currentLanguage}
              onSelectLanguage={onSelectLanguage}
              highContrast={highContrast}
            />

            {/* User Session Info or Quick Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-200">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                    {currentUser.role === 'patient' ? `Patient (${currentUser.id})` : currentUser.role === 'doctor' ? 'Clinician' : 'Staff'}
                  </span>
                </div>
                <button
                  id="dashboard-jump-btn"
                  onClick={() => {
                    if (currentUser.role === 'patient') onNavigate('patient-dashboard');
                    else onNavigate('doctor-dashboard');
                  }}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  title="Go to Dashboard"
                >
                  {currentUser.role === 'patient' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  id="patient-login-cta-btn"
                  onClick={() => onOpenLogin('patient')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors"
                >
                  {t.imPatient}
                </button>
                <button
                  id="doctor-login-cta-btn"
                  onClick={() => onOpenLogin('doctor')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors flex items-center gap-1"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{t.imDoctor}</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Role Navigation Secondary Sub-Bar */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 py-1.5 hidden md:block text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-emerald-800 transition-colors flex items-center gap-1 font-semibold"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.home}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-emerald-800 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.about}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-700 font-semibold">Our Promise:</span>
            <span>Care that puts your health and well-being first.</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('landing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 font-semibold text-slate-800"
            >
              {t.home}
            </button>
            <button
              onClick={() => {
                onNavigate('about');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 font-semibold text-slate-800"
            >
              {t.about}
            </button>
          </div>

          {!currentUser && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenLogin('patient');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-center font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
              >
                {t.imPatient}
              </button>
              <button
                onClick={() => {
                  onOpenLogin('doctor');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-center font-semibold bg-emerald-700 text-white"
              >
                {t.imDoctor}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
