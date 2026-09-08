/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive AI-Assisted Patient Clinical Intake Flow
 * Implements Section 10 through 22:
 * Multilingual speech & text interview, pain scale, red-flag detection,
 * document upload, explicit consent, and queue token generation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Building2,
  ShieldCheck,
  User,
  HeartPulse,
  Activity,
  Calendar,
  Clock,
  Printer,
  Share2,
  Languages,
  LayoutGrid,
  PenTool,
  Check,
  Flame,
  Brain,
  Thermometer,
  Wind,
  Zap,
  RefreshCw,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  Patient,
  Doctor,
  Hospital,
  InterviewTurn,
  UploadedDocument,
  StructuredAiCaseSheet,
  QueueToken,
} from '../../types';
import { SupportedLanguage, TRANSLATIONS } from '../../i18n/translations';
import { AiService } from '../../services/aiService';
import { VoiceService } from '../../services/voiceService';
import { StorageService } from '../../services/storageService';
import { LocationService } from '../../services/locationService';
import { HospitalDiscoveryModal } from './HospitalDiscoveryModal';
import { OriginalDocumentViewer } from '../common/OriginalDocumentViewer';
import { APP_CONFIG } from '../../config/appConfig';
import { GUIDED_SYMPTOM_CARDS, GuidedSymptomCard, GuidedFollowUpOption } from '../../data/guidedSymptomsData';

interface CaseIntakeWizardProps {
  currentPatient: Patient;
  currentLanguage: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onIntakeCompleted: (token: QueueToken) => void;
  onCancel: () => void;
  initialSymptom?: string;
  highContrast?: boolean;
}

export type IntakeInputMode = 'guided' | 'voice' | 'type';

const INDIAN_LANGUAGES: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

const VOICE_ASSISTANT_GREETINGS: Record<SupportedLanguage, string> = {
  en: 'Namaste! Please speak freely and describe the symptoms or health discomfort you are experiencing today.',
  hi: 'नमस्ते! कृपया बोलकर बताएं कि आज आपको क्या तकलीफ या दर्द महसूस हो रहा है।',
  kn: 'ನಮಸ್ಕಾರ! ಇಂದು ನಿಮಗೆ ಯಾವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ನೋವು ಇದೆ ಎಂಬುದನ್ನು ದಯವಿಟ್ಟು ಮಾತನಾಡಿ ತಿಳಿಸಿ.',
  te: 'నమస్కారం! ఈ రోజు మీకు ఏ ఆరోగ్య సమస్య లేదా నొప్పి ఉందో దయచేసి మాట్లాడి చెప్పండి.',
  ta: 'வணக்கம்! இன்று உங்களுக்கு என்ன உடல்நலப் பிரச்சனை அல்லது வலி உள்ளது என்பதை தயவுசெய்து பேசி கூறுங்கள்.',
  ml: 'നമസ്കാരം! ഇന്ന് നിങ്ങൾക്ക് എന്ത് ആരോഗ്യപ്രശ്നമോ വേദനയോ ആണ് അനുഭവപ്പെടുന്നത് എന്ന് സംസാരിച്ച് പറയൂ.',
  mr: 'नमस्ते! आज तुम्हाला कोणता त्रास किंवा दुखणे जाणवत आहे ते कृपया बोलून सांगा.',
  bn: 'নমস্কার! আজ আপনার কী শারীরিক সমস্যা বা ব্যথা হচ্ছে তা দয়া করে মুখে বলুন।',
  gu: 'નમસ્તે! આજે તમને કઈ સ્વાસ્થ્ય તકલીફ કે દુખાવો થઈ રહ્યો છે તે કૃપા કરીને બોલીને જણાવો.',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਤੁਹਾਨੂੰ ਕਿਹੜੀ ਤਕਲੀਫ ਜਾਂ ਦਰਦ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਬੋਲ ਕੇ ਦੱਸੋ।',
};

export const CaseIntakeWizard: React.FC<CaseIntakeWizardProps> = ({
  currentPatient,
  currentLanguage,
  onLanguageChange,
  onIntakeCompleted,
  onCancel,
  initialSymptom,
  highContrast,
}) => {
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(currentLanguage);
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  // 3 Primary Intake Modes: Guided Cards (default), Voice Assistant, or Type on your own
  const [intakeMode, setIntakeMode] = useState<IntakeInputMode>('guided');

  // Guided Cards State
  const [selectedGuidedCardId, setSelectedGuidedCardId] = useState<string>('chest-pain');
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, { optionId: string; optionLabel: string; questionText: string }>>({});

  // Wizard Step State (1: Chief Complaint & Input Mode, 2: Guided Symptoms & Severity, 3: AI Interview, 4: Medical History, 5: Uploads, 6: Review & Consent, 7: Token Receipt)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Hospital Selection State
  const [selectedHospital, setSelectedHospital] = useState<Hospital>(
    LocationService.getSelectedHospital()
  );
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // Clinical Intake Data States
  const [chiefComplaint, setChiefComplaint] = useState<string>(initialSymptom || '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painScore, setPainScore] = useState<number>(5);
  const [onsetPeriod, setOnsetPeriod] = useState<string>('Yesterday evening');
  const [aggravatingFactors, setAggravatingFactors] = useState<string>('Worse upon walking or exertion');
  const [relievingFactors, setRelievingFactors] = useState<string>('Mild relief while sitting or resting');

  // AI Conversational Interview State
  const [conversationHistory, setConversationHistory] = useState<InterviewTurn[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string>('');
  const [patientAnswerInput, setPatientAnswerInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState<boolean>(false);

  // Voice Interaction States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Medical History & Documents
  const [allergies, setAllergies] = useState<string>(currentPatient.allergies.join(', '));
  const [existingConditions, setExistingConditions] = useState<string>(
    currentPatient.existingConditions.join(', ')
  );
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(
    StorageService.getDocuments(currentPatient.patientId)
  );
  const [viewingDoc, setViewingDoc] = useState<UploadedDocument | null>(null);

  // Consent & Output Case Sheet
  const [patientConsentAgreed, setPatientConsentAgreed] = useState<boolean>(false);
  const [generatedCaseSheet, setGeneratedCaseSheet] = useState<StructuredAiCaseSheet | null>(null);
  const [generatedToken, setGeneratedToken] = useState<QueueToken | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Curated Common Symptoms for Rapid Tap Selection
  const commonSymptomChips = [
    'Chest Pain / Discomfort',
    'Breathlessness',
    'Cold Sweating',
    'High Fever',
    'Dry Cough',
    'Severe Headache',
    'Dizziness / Vertigo',
    'Knee Joint Pain',
    'Lower Back Pain',
    'Skin Rash / Itching',
    'Abdominal Pain',
    'Fatigue / Weakness',
  ];

  // Initialize initial symptom if passed
  useEffect(() => {
    if (initialSymptom && !chiefComplaint) {
      setChiefComplaint(initialSymptom);
      if (!selectedSymptoms.includes(initialSymptom)) {
        setSelectedSymptoms([initialSymptom]);
      }
    }
  }, [initialSymptom]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      VoiceService.stopSpeaking();
    };
  }, []);

  // Synchronize active language with prop changes
  useEffect(() => {
    setActiveLanguage(currentLanguage);
  }, [currentLanguage]);

  // Language switcher handler with voice interruption
  const handleLanguageSwitch = (newLang: SupportedLanguage) => {
    setActiveLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  // Select Guided Symptom Card
  const handleSelectGuidedCard = (cardId: string) => {
    setSelectedGuidedCardId(cardId);
    const card = GUIDED_SYMPTOM_CARDS.find(c => c.id === cardId);
    if (card) {
      const cardTitle = card.title[activeLanguage] || card.title.en;
      if (!selectedSymptoms.includes(card.title.en)) {
        setSelectedSymptoms(prev => [...prev, card.title.en]);
      }
      if (!chiefComplaint || intakeMode === 'guided') {
        setChiefComplaint(cardTitle);
      }
    }
  };

  // Select Guided Option for an automated follow-up question
  const handleSelectGuidedOption = (
    card: GuidedSymptomCard,
    question: any,
    option: GuidedFollowUpOption
  ) => {
    const qKey = `${card.id}_${question.id}`;
    const questionText = question.question[activeLanguage] || question.question.en;
    const optionLabel = option.label[activeLanguage] || option.label.en;

    const newAnswers = {
      ...guidedAnswers,
      [qKey]: { optionId: option.id, optionLabel, questionText },
    };
    setGuidedAnswers(newAnswers);

    // Update pain score if option carries weighting
    if (option.painScoreWeight) {
      setPainScore(prev => Math.max(prev, option.painScoreWeight!));
    }
    // Update onset timeline if option has hint
    if (option.onsetHint) {
      setOnsetPeriod(option.onsetHint);
    }

    // Build synthesized clinical complaint summary
    const cardTitle = card.title[activeLanguage] || card.title.en;
    const answeredForThisCard = card.questions
      .map(q => {
        const ans = newAnswers[`${card.id}_${q.id}`];
        return ans ? `${ans.questionText}: ${ans.optionLabel}` : null;
      })
      .filter(Boolean);

    const compiled = `${cardTitle}. ${answeredForThisCard.join('. ')}`;
    setChiefComplaint(compiled);

    // Append / update interview turn in conversation history for clinician review
    const aiTurnId = `turn-guided-q-${card.id}-${question.id}`;
    const patientTurnId = `turn-guided-a-${card.id}-${question.id}`;

    setConversationHistory(prev => {
      const filtered = prev.filter(t => t.turnId !== aiTurnId && t.turnId !== patientTurnId);
      return [
        ...filtered,
        {
          turnId: aiTurnId,
          speaker: 'ai',
          text: questionText,
          language: activeLanguage,
          timestamp: new Date().toISOString(),
          provenance: 'Guided Protocol',
        },
        {
          turnId: patientTurnId,
          speaker: 'patient',
          text: optionLabel,
          language: activeLanguage,
          timestamp: new Date().toISOString(),
          provenance: 'Patient 1-Tap Selection',
        },
      ];
    });
  };

  // Trigger first AI clinical intake question when entering Step 3
  useEffect(() => {
    if (currentStep === 3 && conversationHistory.length === 0 && !currentAiQuestion && !isAiLoading) {
      fetchNextAiQuestion([]);
    }
  }, [currentStep]);

  // Fetch next clinical question from AI service
  const fetchNextAiQuestion = async (history: InterviewTurn[]) => {
    setIsAiLoading(true);
    setVoiceError('');
    try {
      const response = await AiService.generateNextQuestion({
        patient: currentPatient,
        chiefComplaint: chiefComplaint || 'General discomfort',
        selectedSymptoms,
        conversationHistory: history,
        language: activeLanguage,
      });

      setCurrentAiQuestion(response.question);
      setIsInterviewCompleted(response.isCompleted);

      // Auto read out clinical question for patient accessibility
      VoiceService.speakText(
        response.question,
        activeLanguage,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (err) {
      console.warn('Error fetching question:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit patient reply in conversation
  const handleSendPatientReply = () => {
    if (!patientAnswerInput.trim() || !currentAiQuestion) return;

    VoiceService.stopSpeaking();
    setIsSpeaking(false);

    const turn: InterviewTurn = {
      turnId: `turn-${Date.now()}`,
      speaker: 'patient',
      text: patientAnswerInput.trim(),
      language: activeLanguage,
      timestamp: new Date().toISOString(),
      provenance: 'Patient Reported',
    };

    const updatedHistory = [
      ...conversationHistory,
      {
        turnId: `turn-ai-${Date.now()}`,
        speaker: 'ai',
        text: currentAiQuestion,
        language: activeLanguage,
        timestamp: new Date().toISOString(),
        provenance: 'AI Generated',
      },
      turn,
    ];

    setConversationHistory(updatedHistory);
    setPatientAnswerInput('');

    if (updatedHistory.filter(t => t.speaker === 'patient').length >= 3) {
      setIsInterviewCompleted(true);
      setCurrentAiQuestion('Thank you. All key details have been recorded for the doctor.');
    } else {
      fetchNextAiQuestion(updatedHistory);
    }
  };

  // Voice STT Toggle
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setVoiceError('');
    VoiceService.stopSpeaking();

    const rec = VoiceService.createRecognitionInstance(
      currentLanguage,
      (text: string, isFinal: boolean) => {
        setPatientAnswerInput(text);
        if (isFinal) {
          setIsListening(false);
        }
      },
      (errorMsg: string) => {
        setVoiceError(errorMsg);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
        setIsListening(true);
      } catch (e) {
        setVoiceError('Could not start microphone. You can type in the box.');
        setIsListening(false);
      }
    }
  };

  // File Upload Handler (simulates secure cloud medical upload)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: UploadedDocument = {
      documentId: `doc_${Date.now()}`,
      patientId: currentPatient.patientId,
      fileName: file.name,
      fileType: file.type.includes('pdf') ? 'pdf' : 'prescription',
      fileURL: URL.createObjectURL(file),
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Patient',
      originalPrescriptionRequiredInspection: true,
      provenance: 'Patient Uploaded Document',
    };

    StorageService.saveDocument(newDoc);
    setUploadedDocs(prev => [newDoc, ...prev]);
  };

  // Generate Case Sheet & Token Submission
  const handleSubmitIntake = async () => {
    if (!patientConsentAgreed) return;

    setIsSubmitting(true);
    try {
      const summary = await AiService.summarizeCase({
        patient: currentPatient,
        chiefComplaint,
        selectedSymptoms,
        conversationHistory,
        painScore,
        existingConditions: existingConditions.split(',').map(s => s.trim()),
        allergies: allergies.split(',').map(s => s.trim()),
        uploadedDocuments: uploadedDocs,
      });

      setGeneratedCaseSheet(summary);

      // Select Doctor from matching department
      const doctors = StorageService.getDoctors();
      const matchedDoctor =
        doctors.find(d => d.department.toLowerCase() === summary.suggestedDepartment.toLowerCase()) ||
        doctors[0];

      // Generate Queue Token
      const newToken = StorageService.generateQueueToken({
        patientId: currentPatient.patientId,
        patientName: currentPatient.name,
        patientAge: currentPatient.age,
        patientGender: currentPatient.gender,
        hospitalId: selectedHospital.hospitalId,
        hospitalName: selectedHospital.name,
        department: summary.suggestedDepartment,
        assignedDoctorId: matchedDoctor.doctorId,
        assignedDoctorName: matchedDoctor.name,
        roomNumber: matchedDoctor.roomNumber,
        chiefComplaint,
        attentionFlags: summary.attentionFlags,
        priority: summary.attentionFlags.length > 0 ? 'Urgent' : 'Standard',
      });

      // Also record visit into database
      StorageService.createVisit({
        patientId: currentPatient.patientId,
        doctorId: matchedDoctor.doctorId,
        doctorName: matchedDoctor.name,
        department: summary.suggestedDepartment,
        hospitalName: selectedHospital.name,
        visitDate: new Date().toISOString(),
        chiefComplaint,
        structuredSymptoms: summary.structuredSymptoms,
        painScore,
        clinicalNarrative: summary.clinicalNarrative,
        attentionFlags: summary.attentionFlags,
        doctorStatus: 'Pending Doctor Verification',
        queueTokenNumber: newToken.tokenNumber,
      });

      setGeneratedToken(newToken);
      setCurrentStep(7); // Jump to Token Receipt
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Progress & Back Header */}
        <div className="flex items-center justify-between">
          <button
            id="intake-cancel-back-btn"
            onClick={onCancel}
            className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {/* Stepper Indicator */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span>Step {currentStep} of 7:</span>
            <span className="text-emerald-700 font-bold">
              {currentStep === 1 && 'Chief Complaint'}
              {currentStep === 2 && 'Symptom Severity'}
              {currentStep === 3 && 'AI Clinical Interview'}
              {currentStep === 4 && 'Medical History'}
              {currentStep === 5 && 'Prescriptions & Lab Reports'}
              {currentStep === 6 && 'Review & Consent'}
              {currentStep === 7 && 'Queue Token Issued'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <button
              onClick={() => setIsHospitalModalOpen(true)}
              className="underline text-emerald-800 font-semibold"
            >
              {selectedHospital.name.slice(0, 24)}...
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* STEP 1: Intake Mode & Chief Complaint */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Language Selection Header */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <Languages className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Language for Questions & Assistant (प्रश्न व सहायक की भाषा)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ask follow-up questions and audio in your preferred Indian language
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                    Active: {INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.label} ({INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.native})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {INDIAN_LANGUAGES.map(lang => {
                    const isSelected = activeLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageSwitch(lang.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{lang.native}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          ({lang.label})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Selection Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 1 of 6 • Patient Intake Method</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  How would you like to share your health concern today?
                </h2>
                <p className="text-xs text-slate-500">
                  Choose how you want to communicate: type freely on your own, talk to the interactive multilingual voice assistant, or tap guided cards for 1-click questions.
                </p>
              </div>

              {/* The 3 Primary Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Mode 1: Type on your own */}
                <button
                  type="button"
                  id="intake-mode-type-btn"
                  onClick={() => setIntakeMode('type')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    intakeMode === 'type'
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${intakeMode === 'type' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <PenTool className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Option 1
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Type on Your Own</h3>
                      <p className="text-[11px] text-emerald-700 font-medium">लिखकर बताएं / Type freely</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Describe your symptoms, pain location, and duration in your own words.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-500">Freeform Text</span>
                    {intakeMode === 'type' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Click to select</span>
                    )}
                  </div>
                </button>

                {/* Mode 2: Interactive Multilingual Voice Assistant */}
                <button
                  type="button"
                  id="intake-mode-voice-btn"
                  onClick={() => {
                    setIntakeMode('voice');
                    if (!isSpeaking) {
                      VoiceService.speakText(
                        VOICE_ASSISTANT_GREETINGS[activeLanguage],
                        activeLanguage,
                        () => setIsSpeaking(true),
                        () => setIsSpeaking(false)
                      );
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    intakeMode === 'voice'
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${intakeMode === 'voice' ? 'bg-emerald-700 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        AI Voice
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Voice Assistant</h3>
                      <p className="text-[11px] text-emerald-700 font-medium">बोलकर बताएं / Voice AI</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Speak naturally in your mother tongue. The assistant listens and speaks back follow-up questions.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-emerald-800">10 Indian Languages</span>
                    {intakeMode === 'voice' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Click to select</span>
                    )}
                  </div>
                </button>

                {/* Mode 3: Guided Symptom Cards */}
                <button
                  type="button"
                  id="intake-mode-guided-btn"
                  onClick={() => setIntakeMode('guided')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    intakeMode === 'guided'
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${intakeMode === 'guided' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Fastest • 1-Click
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Guided Cards</h3>
                      <p className="text-[11px] text-emerald-700 font-medium">कार्ड चुनकर बताएं / Guided Cards</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tap symptom cards and it automatically gives clinical follow-up questions for instant 1-tap answers.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-500">Zero Typing Needed</span>
                    {intakeMode === 'guided' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold">Click to select</span>
                    )}
                  </div>
                </button>
              </div>

              {/* DEDICATED INTERFACE BASED ON SELECTED INTAKE MODE */}

              {/* MODE 1: TYPE ON YOUR OWN */}
              {intakeMode === 'type' && (
                <div className="space-y-5 p-5 rounded-2xl bg-slate-50/60 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Describe your health complaint in your words:
                      </h3>
                      <p className="text-xs text-slate-500">
                        You can type in {INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.label} or English.
                      </p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      id="chief-complaint-textarea"
                      rows={3}
                      value={chiefComplaint}
                      onChange={e => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Sharp chest pain radiating to left arm since yesterday evening, accompanied by breathing difficulty..."
                      className="w-full p-3.5 text-sm bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Quick Symptom Chips */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">
                      Tap to add common symptoms to your text:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {commonSymptomChips.map(s => {
                        const isSelected = selectedSymptoms.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSymptoms(selectedSymptoms.filter(item => item !== s));
                              } else {
                                setSelectedSymptoms([...selectedSymptoms, s]);
                                if (!chiefComplaint) setChiefComplaint(s);
                                else if (!chiefComplaint.includes(s)) {
                                  setChiefComplaint(prev => `${prev}, ${s}`);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hospital Selector Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Intake Hospital:</span>
                        <span className="text-sm font-bold text-slate-900">{selectedHospital.name}</span>
                        <span className="text-xs text-emerald-700 block font-medium">
                          {selectedHospital.address} • {selectedHospital.distanceKm || '2.4'} km away
                        </span>
                      </div>
                    </div>
                    <button
                      id="intake-change-hospital-btn"
                      onClick={() => setIsHospitalModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 shrink-0"
                    >
                      Change Hospital
                    </button>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-200">
                    <button
                      id="intake-step1-type-next-btn"
                      disabled={!chiefComplaint.trim()}
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <span>Continue to Severity & Follow-up Questions</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: INTERACTIVE MULTILINGUAL VOICE ASSISTANT */}
              {intakeMode === 'voice' && (
                <div className="space-y-5 p-5 rounded-2xl bg-emerald-50/30 border border-emerald-200">
                  {/* Assistant Prompt Banner */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-900">
                          Clinical AI Voice Assistant ({INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.native})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isSpeaking) {
                            VoiceService.stopSpeaking();
                            setIsSpeaking(false);
                          } else {
                            VoiceService.speakText(
                              VOICE_ASSISTANT_GREETINGS[activeLanguage],
                              activeLanguage,
                              () => setIsSpeaking(true),
                              () => setIsSpeaking(false)
                            );
                          }
                        }}
                        className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-bold transition-all"
                        title="Listen to Assistant"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4" />}
                        <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      "{VOICE_ASSISTANT_GREETINGS[activeLanguage]}"
                    </p>
                  </div>

                  {/* Central Voice Recording Hub */}
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 space-y-4 text-center">
                    <div className="relative">
                      {isListening && (
                        <div className="absolute inset-0 -m-3 rounded-full bg-emerald-400/30 animate-ping" />
                      )}
                      <button
                        id="voice-mode-mic-btn"
                        type="button"
                        onClick={handleToggleVoiceInput}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                          isListening
                            ? 'bg-rose-600 hover:bg-rose-700 text-white scale-105 animate-pulse ring-4 ring-rose-300'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-105 ring-4 ring-emerald-100'
                        }`}
                      >
                        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">
                        {isListening ? 'Listening to you... Speak now' : 'Tap the microphone to speak'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Speak in {INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.label} ({INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.native}). You can mention what hurts, when it started, and how severe it is.
                      </p>
                    </div>

                    {/* Live Transcript / Input Field */}
                    <div className="w-full max-w-lg space-y-2">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={patientAnswerInput}
                          onChange={e => setPatientAnswerInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && patientAnswerInput.trim()) {
                              if (!chiefComplaint) setChiefComplaint(patientAnswerInput.trim());
                              handleSendPatientReply();
                            }
                          }}
                          placeholder={
                            isListening
                              ? 'Transcribing your speech in real-time...'
                              : 'Your spoken words appear here, or you can type here too...'
                          }
                          className={`w-full py-3 pl-4 pr-12 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 ${
                            isListening ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          disabled={!patientAnswerInput.trim()}
                          onClick={() => {
                            if (!chiefComplaint) setChiefComplaint(patientAnswerInput.trim());
                            handleSendPatientReply();
                          }}
                          className="absolute right-2 p-2 rounded-xl bg-emerald-700 text-white disabled:opacity-40 hover:bg-emerald-800 transition-all"
                          title="Submit response"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick phrase options */}
                      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                        {[
                          'Very sharp chest pain since yesterday',
                          'Trouble breathing when climbing stairs',
                          'High fever with shivering and body ache',
                          'Severe throbbing headache on right side',
                          'Stomach cramps and nausea since morning',
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setPatientAnswerInput(suggestion);
                              if (!chiefComplaint) setChiefComplaint(suggestion);
                            }}
                            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-[11px] font-medium border border-slate-200 transition-all"
                          >
                            + "{suggestion}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Spoken Turns History */}
                  {conversationHistory.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Recorded Clinical Conversation ({conversationHistory.length} turns):
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Multilingual Protocol Active
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {conversationHistory.map(turn => (
                          <div
                            key={turn.turnId}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              turn.speaker === 'ai'
                                ? 'bg-emerald-50/70 border border-emerald-100 text-emerald-950'
                                : 'bg-slate-100 border border-slate-200 text-slate-900 ml-4'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>{turn.speaker === 'ai' ? '🤖 Clinical Assistant' : '👤 You (Spoken)'}</span>
                              <span>{turn.provenance || 'Voice Intake'}</span>
                            </div>
                            <p className="text-xs font-medium">{turn.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hospital Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Intake Hospital:</span>
                        <span className="text-sm font-bold text-slate-900">{selectedHospital.name}</span>
                        <span className="text-xs text-emerald-700 block font-medium">
                          {selectedHospital.address} • {selectedHospital.distanceKm || '2.4'} km away
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsHospitalModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 shrink-0"
                    >
                      Change Hospital
                    </button>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-emerald-200">
                    <button
                      onClick={() => setIntakeMode('guided')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Switch to Guided Cards
                    </button>
                    <button
                      id="intake-step1-voice-next-btn"
                      disabled={!chiefComplaint.trim() && conversationHistory.length === 0}
                      onClick={() => {
                        if (!chiefComplaint && conversationHistory.length > 0) {
                          const lastPatientTurn = [...conversationHistory].reverse().find(t => t.speaker === 'patient');
                          if (lastPatientTurn) setChiefComplaint(lastPatientTurn.text);
                        }
                        setCurrentStep(4);
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <span>Complete Voice Intake & Continue to Medical History</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 3: GUIDED SYMPTOM CARDS WITH AUTOMATIC FOLLOW-UP QUESTIONS */}
              {intakeMode === 'guided' && (
                <div className="space-y-6">
                  {/* Step A: 10 Guided Symptom Cards Grid */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          1. Tap your primary health concern below:
                        </h3>
                        <p className="text-xs text-slate-500">
                          Click any card to automatically display customized follow-up questions in {INDIAN_LANGUAGES.find(l => l.code === activeLanguage)?.native}:
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        10 Clinical Categories
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {GUIDED_SYMPTOM_CARDS.map(card => {
                        const isSelected = selectedGuidedCardId === card.id;
                        const cardTitle = card.title[activeLanguage] || card.title.en;
                        const cardSubtitle = card.subtitle[activeLanguage] || card.subtitle.en;

                        return (
                          <button
                            key={card.id}
                            type="button"
                            id={`guided-card-${card.id}`}
                            onClick={() => handleSelectGuidedCard(card.id)}
                            className={`p-3.5 rounded-2xl text-left border transition-all relative flex flex-col justify-between group ${
                              isSelected
                                ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500 shadow-sm'
                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'}`}>
                                  {card.iconType === 'heart' && <HeartPulse className="w-5 h-5" />}
                                  {card.iconType === 'lungs' && <Wind className="w-5 h-5 text-sky-600" />}
                                  {card.iconType === 'thermometer' && <Thermometer className="w-5 h-5 text-amber-600" />}
                                  {card.iconType === 'stomach' && <Flame className="w-5 h-5 text-orange-600" />}
                                  {card.iconType === 'brain' && <Brain className="w-5 h-5 text-purple-600" />}
                                  {card.iconType === 'bones' && <ShieldCheck className="w-5 h-5 text-blue-600" />}
                                  {card.iconType === 'skin' && <Sparkles className="w-5 h-5 text-emerald-600" />}
                                  {card.iconType === 'dizziness' && <RefreshCw className="w-5 h-5 text-indigo-600" />}
                                  {card.iconType === 'cough' && <Activity className="w-5 h-5 text-teal-600" />}
                                  {card.iconType === 'fatigue' && <Zap className="w-5 h-5 text-yellow-600" />}
                                </div>
                                {isSelected ? (
                                  <span className="p-1 rounded-full bg-emerald-700 text-white">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : card.category.includes('Acute') ? (
                                  <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Priority
                                  </span>
                                ) : null}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {cardTitle}
                                </h4>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                                  {cardSubtitle}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-emerald-800">
                                {card.defaultDepartment}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {card.questions.length} questions
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step B: Automatic Clinical Follow-up Questions for Selected Card */}
                  {selectedGuidedCardId && (() => {
                    const activeCard = GUIDED_SYMPTOM_CARDS.find(c => c.id === selectedGuidedCardId);
                    if (!activeCard) return null;

                    const activeCardTitle = activeCard.title[activeLanguage] || activeCard.title.en;

                    return (
                      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border-2 border-emerald-600/30 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-700 text-white">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                                  Automated Follow-up Questions
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  {activeCard.defaultDepartment} Protocol
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900">
                                Targeted inquiries for: {activeCardTitle}
                              </h3>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">
                            Tap answers below to record clinical history
                          </span>
                        </div>

                        {/* Question List with 1-Tap Option Pills */}
                        <div className="space-y-4">
                          {activeCard.questions.map((q, idx) => {
                            const qKey = `${activeCard.id}_${q.id}`;
                            const selectedAns = guidedAnswers[qKey];
                            const questionText = q.question[activeLanguage] || q.question.en;

                            return (
                              <div
                                key={q.id}
                                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                      {questionText}
                                    </h4>
                                  </div>
                                  {selectedAns && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                      <Check className="w-3 h-3" /> Answered
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                  {q.options.map(opt => {
                                    const isOptSelected = selectedAns?.optionId === opt.id;
                                    const optLabel = opt.label[activeLanguage] || opt.label.en;

                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSelectGuidedOption(activeCard, q, opt)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                          isOptSelected
                                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold scale-[1.02]'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        {isOptSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                        <span>{optLabel}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Step C: 1-Tap Severity & Timeline Quick Pills */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                            Quick Discomfort Intensity & Onset Time (1-Tap Selection)
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Quick Pain Level */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-slate-700 block">
                                Pain / Discomfort Severity:
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { score: 3, label: '1–3 Mild Discomfort', color: 'border-emerald-200 hover:bg-emerald-50' },
                                  { score: 5, label: '4–6 Moderate Pain', color: 'border-amber-200 hover:bg-amber-50' },
                                  { score: 8, label: '7–8 Severe Pain', color: 'border-rose-200 hover:bg-rose-50' },
                                  { score: 10, label: '9–10 Unbearable / Acute', color: 'border-rose-300 hover:bg-rose-100' },
                                ].map(p => {
                                  const isSelected = painScore === p.score;
                                  return (
                                    <button
                                      key={p.score}
                                      type="button"
                                      onClick={() => setPainScore(p.score)}
                                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                                        isSelected
                                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                                          : `bg-slate-50 text-slate-700 ${p.color}`
                                      }`}
                                    >
                                      {isSelected ? `✓ ${p.label}` : p.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Quick Onset */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-slate-700 block">
                                When did it begin?
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  'Within last 2 hours',
                                  'Started earlier today',
                                  'Past 2 to 3 days',
                                  'More than 1 week ago',
                                ].map(onset => {
                                  const isSelected = onsetPeriod === onset;
                                  return (
                                    <button
                                      key={onset}
                                      type="button"
                                      onClick={() => setOnsetPeriod(onset)}
                                      className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                                        isSelected
                                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {isSelected ? `✓ ${onset}` : onset}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Live Synthesized Summary Card */}
                        <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Automatically Synthesized Clinical Complaint:
                            </span>
                            <span className="text-[11px] bg-emerald-900 px-2 py-0.5 rounded text-emerald-200">
                              Severity {painScore}/10 • {onsetPeriod}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed text-white">
                            {chiefComplaint || activeCardTitle}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hospital Location Selector Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Intake Hospital:</span>
                        <span className="text-sm font-bold text-slate-900">{selectedHospital.name}</span>
                        <span className="text-xs text-emerald-700 block font-medium">
                          {selectedHospital.address} • {selectedHospital.distanceKm || '2.4'} km away
                        </span>
                      </div>
                    </div>
                    <button
                      id="intake-change-hospital-btn"
                      onClick={() => setIsHospitalModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 shrink-0"
                    >
                      Change Hospital
                    </button>
                  </div>

                  {/* Bottom Navigation for Guided Cards */}
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                      id="intake-guided-continue-btn"
                      onClick={() => setCurrentStep(4)}
                      className="px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                    >
                      <span>Continue to Medical History & Documents</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Guided Symptom Severity & Pain Scale */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Symptom Severity & Onset Timeline
                </h2>
                <p className="text-xs text-slate-500">
                  Rate how uncomfortable you feel and when this began.
                </p>
              </div>

              {/* 1-10 Visual Pain Scale (Section 12) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900">
                    Pain / Discomfort Intensity (1 to 10 Scale)
                  </label>
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                      painScore >= 8
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : painScore >= 5
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Score: {painScore}/10 —{' '}
                    {painScore <= 3
                      ? 'Mild Discomfort'
                      : painScore <= 6
                      ? 'Moderate Pain'
                      : painScore <= 8
                      ? 'Severe Pain'
                      : 'Very Severe / Acute Pain'}
                  </span>
                </div>

                <input
                  id="pain-score-slider"
                  type="range"
                  min="1"
                  max="10"
                  value={painScore}
                  onChange={e => setPainScore(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />

                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>1 (Barely noticeable)</span>
                  <span>5 (Distracting)</span>
                  <span className="text-rose-600 font-bold">10 (Unbearable)</span>
                </div>
              </div>

              {/* Onset & Aggravating Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    When did this symptom start?
                  </label>
                  <input
                    id="intake-onset-input"
                    type="text"
                    value={onsetPeriod}
                    onChange={e => setOnsetPeriod(e.target.value)}
                    placeholder="e.g. Yesterday morning, 2 hours ago"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    What makes it worse?
                  </label>
                  <input
                    id="intake-aggravating-input"
                    type="text"
                    value={aggravatingFactors}
                    onChange={e => setAggravatingFactors(e.target.value)}
                    placeholder="e.g. Walking upstairs, deep breathing, lying flat"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What gives you any relief?
                </label>
                <input
                  id="intake-relieving-input"
                  type="text"
                  value={relievingFactors}
                  onChange={e => setRelievingFactors(e.target.value)}
                  placeholder="e.g. Resting quietly, drinking warm water"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  id="intake-step2-next-btn"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  <span>Begin AI Clinical Intake Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI Clinical Intake Interview (Multilingual, Voice / Text) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Clinical AI Intake Interview
                  </h2>
                  <p className="text-xs text-slate-500">
                    The assistant asks targeted clinical questions to prepare your case sheet. Speak or type your answers.
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Clinical Intake Mode</span>
                </div>
              </div>

              {/* Chat Timeline */}
              <div className="space-y-3 min-h-64 max-h-80 overflow-y-auto p-2">
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={msg.turnId || idx}
                    className={`flex ${msg.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        msg.speaker === 'patient'
                          ? 'bg-emerald-700 text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="text-[10px] font-bold opacity-75 mb-1 flex items-center gap-1">
                        {msg.speaker === 'patient' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        <span>{msg.speaker === 'patient' ? 'Your Answer' : 'Clinical Assistant'}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}

                {/* Active AI Question Prompt */}
                {isAiLoading ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3 text-xs text-slate-600 animate-pulse">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Analyzing clinical presentation and preparing next question...</span>
                  </div>
                ) : currentAiQuestion ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-slate-900 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>Question for You:</span>
                      </span>
                      <button
                        onClick={() => {
                          if (isSpeaking) {
                            VoiceService.stopSpeaking();
                            setIsSpeaking(false);
                          } else {
                            VoiceService.speakText(
                              currentAiQuestion,
                              currentLanguage,
                              () => setIsSpeaking(true),
                              () => setIsSpeaking(false)
                            );
                          }
                        }}
                        className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-100"
                        title="Toggle Text-to-Speech"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-emerald-950">{currentAiQuestion}</p>
                  </div>
                ) : null}
              </div>

              {/* Voice Error Notice if Denied */}
              {voiceError && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{voiceError}</span>
                </div>
              )}

              {/* Patient Response Input Box (Voice + Text + Guided) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="relative flex items-center">
                  <input
                    id="patient-intake-answer-input"
                    type="text"
                    value={patientAnswerInput}
                    onChange={e => setPatientAnswerInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendPatientReply()}
                    placeholder={
                      isListening
                        ? 'Listening... Speak now...'
                        : 'Type your answer or tap the microphone to speak...'
                    }
                    className={`w-full py-3 pl-4 pr-24 text-sm border rounded-2xl focus:ring-2 focus:border-emerald-600 ${
                      isListening
                        ? 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/30'
                        : 'border-slate-300'
                    }`}
                  />

                  <div className="absolute right-2 flex items-center space-x-1.5">
                    {/* Voice Microphone Toggle Button */}
                    <button
                      id="voice-mic-input-btn"
                      type="button"
                      onClick={handleToggleVoiceInput}
                      className={`p-2 rounded-xl transition-all ${
                        isListening
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                      }`}
                      title={isListening ? 'Stop Listening' : 'Tap to Speak'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      id="send-answer-reply-btn"
                      type="button"
                      onClick={handleSendPatientReply}
                      disabled={!patientAnswerInput.trim()}
                      className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick One-Tap Clinical Answer Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">Quick answers:</span>
                  {[
                    'Yes, spreads to left shoulder',
                    'No radiation elsewhere',
                    'Worse when walking',
                    'Relieved after resting',
                    'No cold sweating',
                  ].map(reply => (
                    <button
                      key={reply}
                      onClick={() => {
                        setPatientAnswerInput(reply);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  id="intake-step3-next-btn"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  <span>Continue to Medical History</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Medical History & Allergies */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Existing Medical Conditions & Known Allergies
                </h2>
                <p className="text-xs text-slate-500">
                  Please verify your medical background so the doctor is aware of pre-existing risk factors.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Existing Health Conditions
                </label>
                <input
                  id="intake-existing-conditions-input"
                  type="text"
                  value={existingConditions}
                  onChange={e => setExistingConditions(e.target.value)}
                  placeholder="e.g. Hypertension (5 years), Type 2 Diabetes, Asthma"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  id="intake-allergies-input"
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, None reported"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Doctor Safety Reminder:</span>
                Allergies and current medications are permanently saved to your patient record and prominently highlighted on the clinician&apos;s case sheet.
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  id="intake-step4-next-btn"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  <span>Continue to Document Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Prescription & Medical Document Upload (Section 19) */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Upload Previous Prescriptions & Lab Reports
                </h2>
                <p className="text-xs text-slate-500">
                  The original document is preserved unaltered. The doctor will read and inspect the original directly.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-3xl bg-slate-50 text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Upload prescription photo, ECG, or lab report
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports JPG, PNG, PDF up to 15 MB
                  </span>
                </div>
                <div>
                  <label
                    htmlFor="medical-doc-file-input"
                    className="inline-block px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Select File From Device
                  </label>
                  <input
                    id="medical-doc-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Documents for Clinician Review:
                </span>
                {uploadedDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No previous documents uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocs.map(doc => (
                      <div
                        key={doc.documentId}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{doc.fileName}</div>
                            <div className="text-[11px] text-slate-500">
                              Original Unaltered Document • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                        >
                          View Original
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inspection Modal if Active */}
              {viewingDoc && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-800">Original Document Preview</span>
                    <button
                      onClick={() => setViewingDoc(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      Close Preview ✕
                    </button>
                  </div>
                  <OriginalDocumentViewer document={viewingDoc} />
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  id="intake-step5-next-btn"
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  <span>Review & Consent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Explicit Patient Consent (Section 21 & 22) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Case Summary & Patient Consent
                </h2>
                <p className="text-xs text-slate-500">
                  Please review your intake details before final submission to the hospital OPD queue.
                </p>
              </div>

              {/* Structured Summary Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Patient Name & ID:</span>
                    <span className="font-bold text-slate-900">
                      {currentPatient.name} ({currentPatient.age}y / {currentPatient.gender}) • {currentPatient.patientId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hospital & Center:</span>
                    <span className="font-bold text-slate-900">{selectedHospital.name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block">Reported Chief Complaint:</span>
                  <span className="font-semibold text-slate-900 text-sm">{chiefComplaint}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Associated Symptoms:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSymptoms.join(', ') || 'None specified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Discomfort Rating:</span>
                    <span className="font-bold text-emerald-800">{painScore}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Onset:</span>
                    <span className="font-semibold text-slate-900">{onsetPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Explicit Mandatory Patient Consent Checkbox (Section 21) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    id="patient-intake-consent-checkbox"
                    type="checkbox"
                    checked={patientConsentAgreed}
                    onChange={e => setPatientConsentAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-700 rounded-sm border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                    <span className="font-bold text-emerald-900 block mb-0.5">
                      Mandatory Clinical Intake Consent:
                    </span>
                    &quot;I confirm these details are accurate to the best of my knowledge. I understand this information will be reviewed by a certified doctor.&quot;
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  id="final-submit-intake-btn"
                  disabled={!patientConsentAgreed || isSubmitting}
                  onClick={handleSubmitIntake}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generating Queue Token...' : 'Confirm & Submit to Hospital'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Queue Token Receipt & Confirmation (Section 22) */}
          {currentStep === 7 && generatedToken && (
            <div className="space-y-6">
              {/* Success Badge */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Clinical Intake Complete!
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your case sheet has been securely routed to the OPD consultation queue. Please proceed to the room indicated below.
                </p>
              </div>

              {/* Official Hospital OPD Token Pass (Authentic Physical Receipt Style) */}
              <div
                id="printable-opd-token-card"
                className="max-w-md mx-auto bg-white rounded-3xl border-2 border-emerald-600 shadow-xl overflow-hidden"
              >
                {/* Header Band */}
                <div className="bg-emerald-700 text-white p-4 text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-200">
                    LifeBridge • National Health OPD
                  </div>
                  <div className="text-base font-bold">{selectedHospital.name}</div>
                  <div className="text-xs text-emerald-100">
                    {generatedToken.department} Department
                  </div>
                </div>

                {/* Token Number Hero Display */}
                <div className="p-6 text-center border-b border-dashed border-slate-300 space-y-1 bg-emerald-50/30">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Your Queue Token Number
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-950 tracking-tight">
                    {generatedToken.tokenNumber}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800">
                    Estimated Wait Time: ~{generatedToken.estimatedWaitMinutes} minutes
                  </div>
                </div>

                {/* Consultation Logistics Details */}
                <div className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-bold text-slate-900">
                      {generatedToken.patientName} ({currentPatient.patientId})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Consulting Doctor:</span>
                    <span className="font-bold text-slate-900">
                      {generatedToken.assignedDoctorName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Assigned Room:</span>
                    <span className="font-extrabold text-emerald-800">
                      {generatedToken.roomNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority Level:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        generatedToken.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {generatedToken.priority}
                    </span>
                  </div>
                </div>

                {/* Barcode & QR Stamp Representation */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center space-y-2">
                  <div className="h-9 w-48 mx-auto bg-slate-800 flex items-center justify-around px-2 rounded-xs">
                    {/* Simulated barcode bars */}
                    <div className="w-1 bg-white h-full"></div>
                    <div className="w-2 bg-white h-full"></div>
                    <div className="w-0.5 bg-white h-full"></div>
                    <div className="w-1.5 bg-white h-full"></div>
                    <div className="w-1 bg-white h-full"></div>
                    <div className="w-3 bg-white h-full"></div>
                    <div className="w-0.5 bg-white h-full"></div>
                    <div className="w-2 bg-white h-full"></div>
                    <div className="w-1 bg-white h-full"></div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {generatedToken.tokenId}
                  </div>
                </div>
              </div>

              {/* Actions: Print Token & Done */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                <button
                  id="print-token-pass-btn"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print OPD Token Pass</span>
                </button>
                <button
                  id="finish-intake-jump-btn"
                  onClick={() => onIntakeCompleted(generatedToken)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Go to Patient Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hospital Location Discovery Modal */}
      <HospitalDiscoveryModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        onSelectHospital={h => setSelectedHospital(h)}
        selectedHospitalId={selectedHospital.hospitalId}
      />
    </div>
  );
};
