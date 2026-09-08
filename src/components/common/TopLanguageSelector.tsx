/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Prominent Top Multilingual Selector for Universal Accessibility
 * Displays native Indian language scripts for effortless comprehension.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { SupportedLanguage } from '../../i18n/translations';

interface TopLanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  highContrast?: boolean;
}

export const TopLanguageSelector: React.FC<TopLanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  highContrast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLangConfig = APP_CONFIG.languages.find(l => l.code === currentLanguage) || APP_CONFIG.languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left" id="top-language-selector-wrapper">
      <button
        id="top-language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current language: ${activeLangConfig.name} (${activeLangConfig.nativeName}). Click to switch Indian language.`}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border shadow-2xs ${
          highContrast
            ? 'bg-black text-white border-amber-400 hover:bg-neutral-900'
            : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-300 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
        }`}
      >
        <Globe className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-950 font-bold">{activeLangConfig.nativeName}</span>
          <span className="text-slate-500 font-normal text-xs hidden sm:inline">({activeLangConfig.name})</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="top-language-dropdown-menu"
          className={`absolute right-0 mt-1.5 w-64 rounded-xl shadow-xl border z-50 overflow-hidden py-1 divide-y divide-slate-100 ${
            highContrast
              ? 'bg-black border-amber-400 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
          role="listbox"
          aria-label="Select preferred Indian language"
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select Language / भाषा चुनें
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {APP_CONFIG.languages.map(lang => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectLanguage(lang.code as SupportedLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-base font-semibold leading-snug">{lang.nativeName}</span>
                    <span className="text-xs text-slate-500">{lang.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
