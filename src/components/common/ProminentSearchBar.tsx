/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Prominently Placed Top Search Bar for Universal Accessibility
 * Fast lookup for symptoms, medical departments, doctors, nearby hospitals, and token IDs.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Stethoscope, Building2, User, FileText, ArrowRight, Mic } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Doctor, Hospital, QueueToken } from '../../types';

interface SearchResultItem {
  id: string;
  type: 'symptom' | 'doctor' | 'department' | 'hospital' | 'token';
  title: string;
  subtitle: string;
  badge?: string;
  actionData?: any;
}

interface ProminentSearchBarProps {
  onSelectResult?: (item: SearchResultItem) => void;
  onQuickSymptomSelect?: (symptom: string) => void;
  onOpenVoiceAssistant?: () => void;
  highContrast?: boolean;
  placeholderText?: string;
}

export const ProminentSearchBar: React.FC<ProminentSearchBarProps> = ({
  onSelectResult,
  onQuickSymptomSelect,
  onOpenVoiceAssistant,
  highContrast,
  placeholderText = 'Search symptoms, doctors, departments, nearby hospitals...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search bar for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic across doctors, departments, hospitals, and tokens
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const items: SearchResultItem[] = [];

    // 1. Symptom matches
    const symptomsCatalog = [
      { name: 'Chest Pain / Tightness', dept: 'Cardiology', redFlag: 'Potential Red-Flag' },
      { name: 'Shortness of Breath', dept: 'Cardiology / Pulmonology', redFlag: 'Potential Red-Flag' },
      { name: 'High Fever with Chills', dept: 'General Medicine' },
      { name: 'Joint Pain & Swelling', dept: 'Orthopedics' },
      { name: 'Severe Headache & Dizziness', dept: 'Neurology' },
      { name: 'Skin Itching & Rash', dept: 'Dermatology' },
      { name: 'Cold & Persistent Cough', dept: 'General Medicine' },
      { name: 'Abdominal Stomach Pain', dept: 'General Medicine' },
    ];

    symptomsCatalog.forEach(sym => {
      if (sym.name.toLowerCase().includes(q) || sym.dept.toLowerCase().includes(q)) {
        items.push({
          id: `sym-${sym.name}`,
          type: 'symptom',
          title: sym.name,
          subtitle: `Suggested for ${sym.dept}`,
          badge: sym.redFlag,
          actionData: sym.name,
        });
      }
    });

    // 2. Doctor matches
    const doctors = StorageService.getDoctors();
    doctors.forEach((doc: Doctor) => {
      if (
        doc.name.toLowerCase().includes(q) ||
        doc.department.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q)
      ) {
        items.push({
          id: `doc-${doc.doctorId}`,
          type: 'doctor',
          title: doc.name,
          subtitle: `${doc.qualification} • ${doc.department} (${doc.roomNumber})`,
          badge: doc.availability,
          actionData: doc,
        });
      }
    });

    // 3. Department matches
    const depts = ['Cardiology', 'General Medicine', 'Orthopedics', 'Neurology', 'Dermatology', 'Pediatrics'];
    depts.forEach(d => {
      if (d.toLowerCase().includes(q)) {
        items.push({
          id: `dept-${d}`,
          type: 'department',
          title: `${d} Department`,
          subtitle: `Specialized outpatient & clinical consultation`,
          actionData: d,
        });
      }
    });

    // 4. Hospital matches
    const hospitals = StorageService.getHospitals();
    hospitals.forEach((hosp: Hospital) => {
      if (hosp.name.toLowerCase().includes(q) || hosp.city.toLowerCase().includes(q)) {
        items.push({
          id: `hosp-${hosp.hospitalId}`,
          type: 'hospital',
          title: hosp.name,
          subtitle: `${hosp.address} • ${hosp.distanceKm || '2.4'} km away`,
          badge: hosp.status,
          actionData: hosp,
        });
      }
    });

    // 5. Token & Patient matches
    const tokens = StorageService.getTokens();
    tokens.forEach((tok: QueueToken) => {
      if (
        tok.tokenNumber.toLowerCase().includes(q) ||
        tok.patientName.toLowerCase().includes(q) ||
        tok.chiefComplaint.toLowerCase().includes(q)
      ) {
        items.push({
          id: `tok-${tok.tokenId}`,
          type: 'token',
          title: `Token ${tok.tokenNumber} — ${tok.patientName}`,
          subtitle: `${tok.department} • ${tok.chiefComplaint}`,
          badge: tok.status,
          actionData: tok,
        });
      }
    });

    setResults(items.slice(0, 7)); // Top 7 accessible results
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'symptom' && onQuickSymptomSelect) {
      onQuickSymptomSelect(item.title);
    }
    if (onSelectResult) {
      onSelectResult(item);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto" role="search">
      {/* Prominent Accessible Search Bar Input */}
      <div
        className={`relative flex items-center rounded-xl transition-all duration-200 shadow-sm border ${
          highContrast
            ? 'bg-black text-white border-amber-400 ring-2 ring-amber-400'
            : 'bg-white text-slate-900 border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/30'
        }`}
      >
        <div className="pl-3.5 pr-2 pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-emerald-700" aria-hidden="true" />
        </div>

        <input
          id="prominent-accessibility-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholderText}
          aria-label="Prominent Healthcare Intake and Doctor Search Bar"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className="w-full py-2.5 sm:py-3 pr-10 text-sm sm:text-base font-medium bg-transparent focus:outline-hidden placeholder:text-slate-400"
        />

        {/* Search Right Controls: Mic Voice Assistant Button & Clear/Kbd */}
        <div className="flex items-center pr-2.5 space-x-1">
          {onOpenVoiceAssistant && (
            <button
              id="searchbar-voice-assistant-mic-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVoiceAssistant();
              }}
              className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
              title="Speak to LifeBridge Voice Assistant (आवाज़ सहायक)"
              aria-label="Speak to Voice Assistant"
            >
              <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span className="hidden xl:inline text-[11px] font-bold text-emerald-800">Voice</span>
            </button>
          )}

          {query ? (
            <button
              id="clear-search-query-btn"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Clear search query"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-xs text-slate-400 bg-slate-100 border border-slate-300 rounded font-mono shadow-2xs">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Live Interactive Results Dropdown */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div
          id="search-results-dropdown"
          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-xl shadow-xl border overflow-hidden max-h-96 overflow-y-auto ${
            highContrast
              ? 'bg-black border-amber-400 text-white'
              : 'bg-white border-slate-200 text-slate-900 divide-y divide-slate-100'
          }`}
          role="listbox"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No matching symptoms, doctors, or hospitals found for &quot;{query}&quot;.
              <div className="mt-1 text-xs text-emerald-700">
                Tip: Try searching &quot;Chest pain&quot;, &quot;Cardiology&quot;, or &quot;Dr. Ananya&quot;.
              </div>
            </div>
          ) : (
            results.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-3 flex items-center justify-between hover:bg-emerald-50/70 transition-colors cursor-pointer group"
                role="option"
                aria-selected="false"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0">
                    {item.type === 'symptom' && <Stethoscope className="w-4 h-4" />}
                    {item.type === 'doctor' && <User className="w-4 h-4" />}
                    {item.type === 'hospital' && <Building2 className="w-4 h-4" />}
                    {item.type === 'department' && <Stethoscope className="w-4 h-4" />}
                    {item.type === 'token' && <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800 flex items-center gap-1.5">
                      {item.title}
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            item.badge.includes('Red-Flag')
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
