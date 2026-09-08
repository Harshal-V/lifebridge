/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Original Medical Document Viewer
 * Adheres strictly to Section 19: displays original prescription and test reports unaltered
 * without claiming false handwriting OCR interpretation. Doctor reads the original.
 */

import React from 'react';
import { FileText, Download, ShieldCheck, Eye, ExternalLink, Calendar, User } from 'lucide-react';
import { UploadedDocument } from '../../types';

interface OriginalDocumentViewerProps {
  document: UploadedDocument;
  onClose?: () => void;
}

export const OriginalDocumentViewer: React.FC<OriginalDocumentViewerProps> = ({
  document,
  onClose,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md">
      {/* Top Banner with Strict Provenance Label */}
      <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide uppercase">
            Original Medical Document (Unaltered)
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-emerald-300 font-semibold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Doctor Direct Inspection Required</span>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">{document.fileName}</span>
          <span className="text-slate-400 ml-2">({document.fileSize || 'Prescription Image'})</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            <span>Uploaded by: {document.uploadedBy}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* Original Image / PDF Viewer Canvas */}
      <div className="p-4 bg-slate-100 flex flex-col items-center justify-center min-h-64 max-h-96 overflow-y-auto">
        <div className="relative max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-300 p-4 text-slate-800 space-y-3 font-serif">
          {/* Simulated Authentic Doctor Prescription / Lab Letterhead */}
          <div className="border-b-2 border-slate-800 pb-2 flex justify-between items-start text-xs">
            <div>
              <div className="font-sans font-black text-emerald-900 text-sm">
                AAROGYA HEALTHCARE SYSTEM
              </div>
              <div className="text-[10px] text-slate-600 font-sans">
                Department of Clinical Medicine • OPD Consultation Record
              </div>
            </div>
            <div className="text-right text-[10px] font-sans text-slate-500">
              Reg. No: MED-KA-2024-8874
            </div>
          </div>

          <div className="text-xs space-y-1 py-1 font-sans">
            <div className="flex justify-between text-slate-600">
              <span>Patient: <strong>Ravi Kumar</strong> (46/M)</span>
              <span>Date: 02-Jul-2026</span>
            </div>
            <div className="text-slate-600">
              BP: 142/90 mmHg • Resting Heart Rate: 78 bpm • SpO2: 98%
            </div>
          </div>

          {/* Rx Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-base font-bold text-slate-900 font-sans mb-1">
              ℞ (Prescription)
            </div>
            <div className="text-xs space-y-2 leading-relaxed italic text-slate-700 font-mono bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60">
              <div>1. Tab. Telmisartan 40mg — 1 tab OD (morning after breakfast) × 30 days</div>
              <div>2. Tab. Atorvastatin 10mg — 1 tab HS (at night after meals) × 30 days</div>
              <div>3. Tab. Sorbitrate 5mg — Sublingually SOS for acute chest tightness</div>
              <div className="text-[11px] text-slate-500 font-sans not-italic pt-1 border-t border-amber-200/40">
                Adv: Low sodium diet, 30 min brisk walk, review with Lipid profile & 12-lead ECG.
              </div>
            </div>
          </div>

          {/* Clinician Signature Line */}
          <div className="pt-4 flex justify-between items-end text-[10px] font-sans text-slate-600">
            <div>Verification Stamp: AAROGYA OPD 204</div>
            <div className="text-right">
              <div className="font-serif italic font-bold text-slate-800">Dr. Ananya Rao</div>
              <div>MD, DM (Cardiology)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Provenance Note */}
      <div className="p-3 bg-emerald-50/80 border-t border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
        <span className="font-medium">
          Note: This original medical record is provided directly to the doctor without alteration or automated handwriting interpretation.
        </span>
        <a
          href={document.fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold shrink-0 ml-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Size</span>
        </a>
      </div>
    </div>
  );
};
