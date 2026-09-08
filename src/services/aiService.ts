/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Clinical AI Service Abstraction Layer
 * Interfaces with server-side AI endpoints with automatic graceful fallback.
 * Strictly enforces clinical safety boundaries: patient context preparation with certified clinician decisions.
 */

import { Patient, StructuredAiCaseSheet, InterviewTurn, UploadedDocument } from '../types';

export interface QuestionRequest {
  patient: Patient;
  chiefComplaint: string;
  selectedSymptoms: string[];
  conversationHistory: InterviewTurn[];
  language: string;
}

export interface QuestionResponse {
  question: string;
  isCompleted: boolean;
  source: string;
}

export interface SummarizeRequest {
  patient: Patient;
  chiefComplaint: string;
  selectedSymptoms: string[];
  conversationHistory: InterviewTurn[];
  painScore: number;
  existingConditions: string[];
  allergies: string[];
  uploadedDocuments: UploadedDocument[];
}

export const AiService = {
  /**
   * Generates the single next clinical follow-up question
   */
  async generateNextQuestion(data: QuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await fetch('/api/ai/clinical-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
      throw new Error('Server AI call returned non-200 status');
    } catch (err) {
      console.warn('Backend AI route unavailable, using client-side clinical intake rules:', err);
      return this.fallbackQuestionGenerator(data);
    }
  },

  /**
   * Synthesizes the structured case sheet for the clinician
   */
  async summarizeCase(data: SummarizeRequest): Promise<StructuredAiCaseSheet> {
    try {
      const response = await fetch('/api/ai/summarize-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          chiefComplaint: data.chiefComplaint,
          structuredSymptoms: result.structuredSymptoms || data.selectedSymptoms,
          onset: result.onset || 'Reported within last 24-48 hours',
          painScore: data.painScore,
          clinicalNarrative: result.clinicalNarrative || `Patient presents with ${data.chiefComplaint}. Discomfort level is ${data.painScore}/10.`,
          attentionFlags: result.attentionFlags || [],
          suggestedDepartment: result.suggestedDepartment || 'General Medicine',
          departmentConfidence: result.departmentConfidence || 85,
          departmentReasoning: result.departmentReasoning || 'Identified based on clinical presentation',
          statusLabel: 'AI Generated — Requires Doctor Verification',
          generatedAt: new Date().toISOString(),
        };
      }
      throw new Error('Summary call returned non-200 status');
    } catch (err) {
      console.warn('Backend AI summary route unavailable, using client-side clinical synthesis:', err);
      return this.fallbackCaseSynthesizer(data);
    }
  },

  /**
   * Deterministic clinical interview logic for instant client-side fallback
   */
  fallbackQuestionGenerator(data: QuestionRequest): QuestionResponse {
    const turnCount = data.conversationHistory.length;
    const lang = data.language || 'en';
    const text = `${data.chiefComplaint} ${data.selectedSymptoms.join(' ')}`.toLowerCase();

    // After 3-4 thorough clinical turns, wrap up intake
    if (turnCount >= 4) {
      return {
        question: lang === 'hi'
          ? 'धन्यवाद, आपकी सभी प्राथमिक जानकारी दर्ज कर ली गई है। क्या कोई अन्य महत्वपूर्ण लक्षण है जो आप डॉक्टर को बताना चाहते हैं?'
          : 'Thank you, key clinical details have been recorded. Is there any other symptom you would like the doctor to know before submitting?',
        isCompleted: true,
        source: 'clinical-engine-v1',
      };
    }

    // Cardiac specific branch
    if (text.includes('chest') || text.includes('heart') || text.includes('pressure')) {
      if (turnCount === 0) {
        return {
          question: lang === 'hi'
            ? 'क्या यह दर्द या भारीपन आपके बाएं कंधे, हाथ, जबड़े या पीठ की तरफ फैलता महसूस होता है?'
            : 'Does the chest pain or tightness spread anywhere else, such as your left arm, shoulder, neck, or back?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
      if (turnCount === 1) {
        return {
          question: lang === 'hi'
            ? 'क्या इसके साथ सांस लेने में तकलीफ, बहुत ज्यादा ठंडा पसीना या चक्कर आने जैसा महसूस हुआ है?'
            : 'Are you experiencing any shortness of breath, cold sweating, or lightheadedness along with it?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
      if (turnCount === 2) {
        return {
          question: lang === 'hi'
            ? 'क्या चलने-फिरने से दर्द बढ़ता है और आराम करने या बैठने से कुछ राहत मिलती है?'
            : 'Does the discomfort get worse when walking or exerting yourself, and does resting bring relief?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
    }

    // Respiratory / Fever branch
    if (text.includes('fever') || text.includes('cough') || text.includes('breath')) {
      if (turnCount === 0) {
        return {
          question: lang === 'hi'
            ? 'बुखार या खांसी कितने दिनों से है और क्या यह रात में अधिक बढ़ जाती है?'
            : 'How many days have you had this fever or cough, and does it worsen particularly at night or early morning?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
      if (turnCount === 1) {
        return {
          question: lang === 'hi'
            ? 'क्या सांस लेते समय सीने में घरघराहट या पसलियों में खिंचाव महसूस हो रहा है?'
            : 'Have you noticed any wheezing sounds, difficulty catching your breath, or chest tightness?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
    }

    // Joint / Orthopedic branch
    if (text.includes('joint') || text.includes('knee') || text.includes('back') || text.includes('bone')) {
      if (turnCount === 0) {
        return {
          question: lang === 'hi'
            ? 'क्या जोड़ या कमर में सूजन, लालिमा या सुबह उठने पर जकड़न (stiffness) रहती है?'
            : 'Is there any visible swelling, redness, or morning stiffness in the joint or back?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
      if (turnCount === 1) {
        return {
          question: lang === 'hi'
            ? 'क्या हाल ही में कोई चोट, खिंचाव या भारी वजन उठाने की घटना हुई थी?'
            : 'Did you experience any recent slip, fall, twist, or strenuous physical lifting?',
          isCompleted: false,
          source: 'clinical-engine-v1',
        };
      }
    }

    // General sequential clarifying questions
    const generalQuestions = [
      'When exactly did you first experience this discomfort, and does it stay constant or come in waves?',
      'Can you describe the exact feeling (e.g. sharp, dull ache, burning, throbbing, or pressing)?',
      'Does taking food, resting, or changing body posture make the feeling better or worse?',
      'Have you taken any home remedies, pain relief tablets, or prior medications for this today?'
    ];

    return {
      question: generalQuestions[turnCount % generalQuestions.length],
      isCompleted: turnCount >= 3,
      source: 'clinical-engine-v1',
    };
  },

  /**
   * Deterministic clinical case synthesizer
   */
  fallbackCaseSynthesizer(data: SummarizeRequest): StructuredAiCaseSheet {
    const full = `${data.chiefComplaint} ${data.selectedSymptoms.join(' ')}`.toLowerCase();
    const attentionFlags: string[] = [];

    // Red flag detection
    if (full.includes('chest') && (full.includes('breath') || full.includes('sweat') || full.includes('arm') || full.includes('tight'))) {
      attentionFlags.push('⚠ ATTENTION: Reported chest pain with breathlessness / diaphoresis — High suspicion for Acute Coronary Syndrome');
    }
    if (full.includes('loss of consciousness') || full.includes('fainted') || full.includes('syncope')) {
      attentionFlags.push('⚠ ATTENTION: History of syncope / sudden collapse reported');
    }
    if (data.painScore >= 8) {
      attentionFlags.push(`⚠ ATTENTION: Severe self-reported pain score (${data.painScore}/10)`);
    }

    let dept = 'General Medicine';
    let reasoning = 'Broad internal medicine clinical assessment indicated.';
    let conf = 85;

    if (full.includes('chest') || full.includes('heart') || full.includes('palpitation') || full.includes('bp') || full.includes('hypertension')) {
      dept = 'Cardiology';
      reasoning = 'Cardiac symptomatology reported (chest pressure, breathlessness, or cardiovascular history).';
      conf = 92;
    } else if (full.includes('joint') || full.includes('knee') || full.includes('bone') || full.includes('fracture') || full.includes('back')) {
      dept = 'Orthopedics';
      reasoning = 'Musculoskeletal pain, joint stiffness or mobility restriction.';
      conf = 88;
    } else if (full.includes('headache') || full.includes('dizziness') || full.includes('numb') || full.includes('seizure')) {
      dept = 'Neurology';
      reasoning = 'Central or peripheral neurological presentation reported.';
      conf = 86;
    } else if (full.includes('rash') || full.includes('skin') || full.includes('itching') || full.includes('allergy')) {
      dept = 'Dermatology';
      reasoning = 'Cutaneous manifestations and skin allergic reactions.';
      conf = 90;
    } else if (data.patient?.age && data.patient.age < 14) {
      dept = 'Pediatrics';
      reasoning = 'Pediatric age cohort presenting for specialized evaluation.';
      conf = 95;
    }

    return {
      chiefComplaint: data.chiefComplaint,
      structuredSymptoms: data.selectedSymptoms.length > 0 ? data.selectedSymptoms : [data.chiefComplaint],
      onset: 'Within the last 24 to 48 hours',
      painScore: data.painScore,
      clinicalNarrative: `Patient reports ${data.chiefComplaint} with associated findings: ${data.selectedSymptoms.join(', ') || 'none specified'}. Discomfort rated at ${data.painScore}/10. Intake structured for immediate clinician verification.`,
      attentionFlags,
      suggestedDepartment: dept,
      departmentConfidence: conf,
      departmentReasoning: reasoning,
      statusLabel: 'AI Generated — Requires Doctor Verification',
      generatedAt: new Date().toISOString(),
    };
  },
};
