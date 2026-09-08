import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client with recommended telemetry header
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Gemini client with provided key:', err);
    }
  }
  return geminiClient;
}

// Resilient helper with automatic retry and model fallback for 503 high-demand spikes
async function generateWithFallback<T>(
  requestPayload: (modelName: string) => Promise<T>
): Promise<T> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    try {
      return await requestPayload(model);
    } catch (err: any) {
      lastError = err;
      const isOverloadedOrUnavailable =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('Resource has been exhausted') ||
        err?.status === 429;

      if (isOverloadedOrUnavailable) {
        console.warn(`Model ${model} experiencing high demand (503/429). Attempting fallback model...`);
        // Short pause before trying alternate model
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }
      // For other client errors, abort chain
      break;
    }
  }
  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AarogyaFlow National Clinical Intake Portal',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Clinical AI Question Generation endpoint
app.post('/api/ai/clinical-question', async (req, res) => {
  const {
    patient,
    chiefComplaint,
    selectedSymptoms = [],
    conversationHistory = [],
    language = 'en',
  } = req.body;

  const ai = getGeminiClient();

  // Fallback clinical question logic if Gemini is not configured or in case of transient API issue
  if (!ai) {
    const question = generateRuleBasedClinicalQuestion(
      selectedSymptoms,
      conversationHistory,
      language,
      chiefComplaint
    );
    return res.json({ question: question.question, isCompleted: question.isCompleted, source: 'clinical-engine' });
  }

  const systemPrompt = `You are the AI Clinical Case Assistant for AarogyaFlow, an Indian hospital clinical intake system.
CRITICAL SAFETY RULES:
1. You are strictly conducting a clinical intake interview.
2. NEVER diagnose, prescribe, recommend medicine, or suggest treatment.
3. NEVER tell the patient they definitely have a condition.
4. Your goal is only to ask ONE short, compassionate, clinically relevant follow-up question based on the patient's reported symptoms and answers.
5. Inquire about: exact location, onset/duration, severity, aggravating/relieving factors, radiation, or critical associated symptoms.
6. Keep each question to 1-2 simple, patient-accessible sentences in the requested language: ${language}.
7. If you have gathered 3-5 key clinical facets (onset, character, radiation/triggers, associated red flags) or the patient has clearly described their situation, indicate that intake is ready for synthesis by ending your question with [INTAKE_COMPLETE] or formulating the concluding confirmation question.`;

  const userPrompt = `Patient Profile:
- Age: ${patient?.age || 'Unknown'}, Gender: ${patient?.gender || 'Unknown'}
- Chief Complaint: ${chiefComplaint || 'Not specified'}
- Selected Symptoms: ${selectedSymptoms.join(', ') || 'None selected'}
- Interview History so far:
${conversationHistory.map((turn: { question?: string; answer?: string }) => `Q: ${turn.question || ''}\nA: ${turn.answer || ''}`).join('\n')}

Generate the single next clinical intake question in language "${language}". If enough clinical detail is collected, mark with [INTAKE_COMPLETE].`;

  try {
    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          { text: systemPrompt },
          { text: userPrompt }
        ],
      });
    });

    const text = response.text || '';
    const isCompleted = text.includes('[INTAKE_COMPLETE]') || conversationHistory.length >= 4;
    const cleanQuestion = text.replace(/\[INTAKE_COMPLETE\]/g, '').trim();

    return res.json({
      question: cleanQuestion || 'Could you describe if anything makes this feeling better or worse?',
      isCompleted,
      source: 'gemini-ai',
    });
  } catch (err) {
    console.warn('Gemini models unavailable (high demand / timeout), smoothly activating clinical fallback engine.');
    const fallback = generateRuleBasedClinicalQuestion(
      selectedSymptoms,
      conversationHistory,
      language,
      chiefComplaint
    );
    return res.json({
      question: fallback.question,
      isCompleted: fallback.isCompleted,
      source: 'clinical-fallback',
    });
  }
});

// Clinical AI Case Summarization endpoint
app.post('/api/ai/summarize-case', async (req, res) => {
  const {
    patient,
    chiefComplaint,
    selectedSymptoms = [],
    conversationHistory = [],
    painScore = 0,
    existingConditions = [],
    allergies = [],
    uploadedDocuments = [],
  } = req.body;

  const ai = getGeminiClient();

  // Check for red flags deterministically as primary safety net
  const detectedRedFlags: string[] = [];
  const lowerComplaint = (chiefComplaint || '').toLowerCase();
  const symptomsJoined = selectedSymptoms.map((s: string) => s.toLowerCase()).join(' ');
  const historyText = conversationHistory.map((c: { answer?: string }) => (c.answer || '').toLowerCase()).join(' ');
  const fullText = `${lowerComplaint} ${symptomsJoined} ${historyText}`;

  if (fullText.includes('chest pain') && (fullText.includes('breath') || fullText.includes('sweat') || fullText.includes('arm'))) {
    detectedRedFlags.push('Chest pain with breathlessness/sweating/radiation - Potential Acute Coronary Syndrome risk');
  }
  if (fullText.includes('loss of consciousness') || fullText.includes('fainted') || fullText.includes('syncope')) {
    detectedRedFlags.push('Reported syncope / loss of consciousness');
  }
  if (fullText.includes('severe breath') || fullText.includes('difficulty breathing') || fullText.includes('gasping')) {
    detectedRedFlags.push('Significant respiratory distress reported');
  }
  if (fullText.includes('slurred speech') || fullText.includes('face drooping') || fullText.includes('weakness in one side')) {
    detectedRedFlags.push('Sudden focal neurological symptoms reported');
  }
  if (fullText.includes('heavy bleeding') || fullText.includes('blood in vomit') || fullText.includes('black stool')) {
    detectedRedFlags.push('Acute gastrointestinal or major bleeding reported');
  }

  if (!ai) {
    const summary = generateRuleBasedSummary({
      patient,
      chiefComplaint,
      selectedSymptoms,
      conversationHistory,
      painScore,
      existingConditions,
      allergies,
      detectedRedFlags,
      uploadedDocuments,
    });
    return res.json(summary);
  }

  const prompt = `You are the AI Clinical Case Synthesizer for AarogyaFlow.
SAFETY RULE: DO NOT diagnose or prescribe.
Synthesize the structured clinical case sheet for the doctor.

Patient: ${patient?.name || 'Patient'}, ${patient?.age || '46'}y, ${patient?.gender || 'Male'}
Chief Complaint: ${chiefComplaint}
Reported Symptoms: ${selectedSymptoms.join(', ')}
Pain Score: ${painScore}/10
Known History: Conditions: ${existingConditions.join(', ') || 'None'}; Allergies: ${allergies.join(', ') || 'None'}
Interview details:
${conversationHistory.map((t: { question?: string; answer?: string }) => `Q: ${t.question} -> A: ${t.answer}`).join('\n')}

Format as a strict JSON object:
{
  "structuredSymptoms": ["string", "string"],
  "onset": "string",
  "clinicalNarrative": "concise 2-3 sentence clinical overview",
  "attentionFlags": ["string"],
  "suggestedDepartment": "Cardiology" | "General Medicine" | "Orthopedics" | "Neurology" | "Dermatology" | "Pediatrics",
  "departmentConfidence": 85,
  "departmentReasoning": "Brief clinical rationale for routing"
}`;

  let parsed: any = null;

  try {
    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json',
        },
      });
    });

    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      parsed = null;
    }
  } catch (err) {
    console.warn('Gemini summarization unavailable (high demand / timeout), smoothly activating clinical summary fallback.');
    parsed = null;
  }

  if (!parsed) {
    const fallbackSummary = generateRuleBasedSummary({
      patient,
      chiefComplaint,
      selectedSymptoms,
      conversationHistory,
      painScore,
      existingConditions,
      allergies,
      detectedRedFlags,
      uploadedDocuments,
    });
    return res.json(fallbackSummary);
  }

  // Merge deterministic safety red flags with AI flags
  const mergedFlags = Array.from(new Set([...(parsed.attentionFlags || []), ...detectedRedFlags]));

  return res.json({
    structuredSymptoms: parsed.structuredSymptoms || selectedSymptoms,
    onset: parsed.onset || 'Reported within last 24-48 hours',
    clinicalNarrative: parsed.clinicalNarrative,
    attentionFlags: mergedFlags,
    suggestedDepartment: parsed.suggestedDepartment || 'General Medicine',
    departmentConfidence: parsed.departmentConfidence || 80,
    departmentReasoning: parsed.departmentReasoning || 'Based on reported clinical presentation',
    provenance: {
      patientReported: true,
      aiGenerated: true,
      doctorVerified: false,
      statusLabel: 'AI Generated — Requires Doctor Verification',
    },
  });
});

// Helper: Rule-based clinical question generator for deterministic fallback & free tier
function generateRuleBasedClinicalQuestion(
  symptoms: string[],
  history: Array<{ question?: string; answer?: string }>,
  lang: string,
  complaint?: string
): { question: string; isCompleted: boolean } {
  const turnCount = history.length;
  const symptomsStr = (symptoms || []).join(' ').toLowerCase() + ' ' + (complaint || '').toLowerCase();

  const questionsByLang: Record<string, string[]> = {
    en: [
      'When did you first notice these symptoms, and have they become steadily worse or do they come and go?',
      'Can you pinpoint the exact location of the discomfort, and does it spread to any other part of your body?',
      'Does anything specific (like movement, food, deep breathing, or resting) make it feel better or worse?',
      'Have you taken any home remedies, pain relievers, or previous medications for this today?',
      'Are you experiencing any other accompanying feelings such as fever, sweating, dizziness, or nausea?'
    ],
    hi: [
      'यह लक्षण सबसे पहले कब शुरू हुए, और क्या यह लगातार बने हुए हैं या आते-जाते रहते हैं?',
      'क्या आप बता सकते हैं कि परेशानी शरीर के किस हिस्से में है और क्या यह कहीं और फैल रही है?',
      'क्या किसी खास गतिविधि, आराम या खान-पान से यह कम या ज्यादा होता है?',
      'क्या आपने इसके लिए आज कोई दवा या घरेलू उपचार लिया है?',
      'क्या आपको इसके साथ पसीना, चक्कर, बुखार या जी मिचलाना जैसा भी महसूस हो रहा है?'
    ],
    kn: [
      'ಈ ಲಕ್ಷಣಗಳು ಮೊದಲು ಯಾವಾಗ ಪ್ರಾರಂಭವಾದವು, ಮತ್ತು ಅವು ನಿರಂತರವಾಗಿದೆಯೇ ಅಥವಾ ಬಂದು ಹೋಗುತ್ತಿವೆಯೇ?',
      'ತೊಂದರೆ ನಿಖರವಾಗಿ ಯಾವ ಜಾಗದಲ್ಲಿದೆ ಮತ್ತು ಬೇರೆ ಕಡೆಗೆ ಹರಡುತ್ತಿದೆಯೇ ಎಂದು ತಿಳಿಸುವಿರಾ?',
      'ವಿಶ್ರಾಂತಿ ಅಥವಾ ಆಹಾರ ಸೇವನೆಯಿಂದ ಇದು ಕಡಿಮೆಯಾಗುತ್ತದೆಯೇ ಅಥವಾ ಹೆಚ್ಚಾಗುತ್ತದೆಯೇ?',
      'ಇಂದು ಇದಕ್ಕಾಗಿ ಯಾವುದೇ ಮಾತ್ರೆ ಅಥವಾ ಮನೆಮದ್ದು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?',
      'ಇದರ ಜೊತೆಗೆ ಬೆವರು, ತಲೆಸುತ್ತು, ಜ್ವರ ಅಥವಾ ವಾಕರಿಕೆ ಕಂಡುಬರುತ್ತಿದೆಯೇ?'
    ],
    te: [
      'ఈ లక్షణాలు మొదట ఎప్పుడు ప్రారంభమయ్యాయి, మరియు అవి నిరంతరంగా ఉన్నాయా లేదా వస్తూ పోతున్నాయా?',
      'సమస్య సరిగ్గా ఎక్కడ ఉంది మరియు శరీరంలో వేరే భాగానికి వ్యాపిస్తుందా?',
      'విశ్రాంతి లేదా ఆహారం వల్ల ఇది తగ్గుతుందా లేదా పెరుగుతుందా?',
      'ఈ రోజు దీని కోసం ఏదైనా మందు లేదా ఉపశమనం తీసుకున్నారా?',
      'దీనితో పాటు చెమట, తలతిరగడం లేదా వాంతులు వచ్చే భావన ఉందా?'
    ],
    ta: [
      'இந்த அறிகுறிகள் எப்போது தொடங்கின, அவை தொடர்ந்து உள்ளதா அல்லது வந்து போகிறதா?',
      'சிரமம் எந்த இடத்தில் சரியாக உள்ளது, வேறு பகுதிக்கு பரவுகிறதா?',
      'ஓய்வு அல்லது உணவு உட்கொள்வதால் இது குறைகிறதா அல்லது அதிகரிக்கிறதா?',
      'இன்று இதற்காக ஏதேனும் மாத்திரை அல்லது மருந்து எடுத்துக்கொண்டீர்களா?',
      'இதனுடன் வியர்வை, மயக்கம் அல்லது குமட்டல் ஏதேனும் உள்ளதா?'
    ]
  };

  const list = questionsByLang[lang] || questionsByLang.en;

  if (turnCount >= 4) {
    return {
      question: lang === 'hi' 
        ? 'धन्यवाद, आपकी सभी मुख्य जानकारी दर्ज हो चुकी है। क्या कोई अन्य महत्वपूर्ण बात डॉक्टर को बतानी है?'
        : 'Thank you, key information has been recorded. Is there any other important symptom you wish the doctor to know?',
      isCompleted: true,
    };
  }

  // Symptom-tailored follow-ups
  if (symptomsStr.includes('chest') || symptomsStr.includes('heart')) {
    if (turnCount === 0) {
      return {
        question: lang === 'hi'
          ? 'क्या छाती में दर्द या भारीपन बाएं हाथ, कंधे, जबड़े या पीठ की तरफ फैलता हुआ महसूस होता है?'
          : 'Does the chest pain or tightness feel like it spreads to your left arm, shoulder, jaw, or back?',
        isCompleted: false,
      };
    }
    if (turnCount === 1) {
      return {
        question: lang === 'hi'
          ? 'क्या इसके साथ सांस लेने में कठिनाई या बहुत ज्यादा पसीना आ रहा है?'
          : 'Are you experiencing any shortness of breath, cold sweating, or dizziness with it?',
        isCompleted: false,
      };
    }
  }

  const selectedQ = list[turnCount % list.length];
  return {
    question: selectedQ,
    isCompleted: turnCount >= 3,
  };
}

function generateRuleBasedSummary(data: any) {
  const selectedSymptoms = data.selectedSymptoms || [];
  const chiefComplaint = data.chiefComplaint || 'Consultation request';
  const painScore = data.painScore || 0;
  const full = `${chiefComplaint} ${selectedSymptoms.join(' ')}`.toLowerCase();

  const detectedRedFlags: string[] = data.detectedRedFlags || [];
  if (full.includes('chest') && (full.includes('breath') || full.includes('sweat'))) {
    detectedRedFlags.push('Chest pain with breathlessness / diaphoresis — Urgent Cardiology Attention');
  }
  if (painScore >= 8) {
    detectedRedFlags.push(`Severe self-reported pain score (${painScore}/10)`);
  }

  let suggestedDept = 'General Medicine';
  let reasoning = 'Comprehensive initial medical evaluation indicated.';
  let confidence = 82;

  if (full.includes('chest') || full.includes('heart') || full.includes('palpitation') || full.includes('bp') || full.includes('hypertension')) {
    suggestedDept = 'Cardiology';
    reasoning = 'Cardiac symptomatology reported (chest pain, discomfort or cardiovascular history).';
    confidence = 88;
  } else if (full.includes('joint') || full.includes('knee') || full.includes('bone') || full.includes('fracture') || full.includes('back pain')) {
    suggestedDept = 'Orthopedics';
    reasoning = 'Musculoskeletal pain and mobility concerns reported.';
    confidence = 85;
  } else if (full.includes('headache') || full.includes('seizure') || full.includes('numb') || full.includes('dizziness')) {
    suggestedDept = 'Neurology';
    reasoning = 'Neurological indicators reported.';
    confidence = 84;
  } else if (full.includes('skin') || full.includes('rash') || full.includes('itching')) {
    suggestedDept = 'Dermatology';
    reasoning = 'Dermatological condition / skin manifestation.';
    confidence = 90;
  } else if (data.patient?.age && parseInt(data.patient.age, 10) < 14) {
    suggestedDept = 'Pediatrics';
    reasoning = 'Pediatric age group.';
    confidence = 92;
  }

  return {
    structuredSymptoms: selectedSymptoms.length > 0 ? selectedSymptoms : [chiefComplaint],
    onset: 'Within the last 24 to 48 hours',
    clinicalNarrative: `Patient reports ${chiefComplaint} with associated symptoms: ${selectedSymptoms.join(', ') || 'none specified'}. Reported discomfort level is ${painScore}/10. Initial intake structured for clinical review.`,
    attentionFlags: Array.from(new Set(detectedRedFlags)),
    suggestedDepartment: suggestedDept,
    departmentConfidence: confidence,
    departmentReasoning: reasoning,
    provenance: {
      patientReported: true,
      aiGenerated: true,
      doctorVerified: false,
      statusLabel: 'AI Generated — Requires Doctor Verification',
    },
  };
}

// Dedicated AI Voice Assistant Endpoint for Natural Multilingual Voice Queries
app.post('/api/ai/voice-assist', async (req, res) => {
  const { query = '', language = 'en' } = req.body;
  const qLower = query.toLowerCase();

  // Check emergency keywords first
  const isEmergency =
    qLower.includes('emergency') ||
    qLower.includes('108') ||
    qLower.includes('112') ||
    qLower.includes('heart attack') ||
    qLower.includes('unconscious') ||
    qLower.includes('ambulance') ||
    (qLower.includes('chest pain') && (qLower.includes('severe') || qLower.includes('breath') || qLower.includes('sweat')));

  const ai = getGeminiClient();

  // Rule-based fallback voice responses for instantaneous playback and offline resilience
  const getRuleBasedVoiceResponse = () => {
    if (isEmergency) {
      if (language === 'hi') {
        return {
          text: 'यह एक आपातकालीन स्थिति हो सकती है। कृपया तुरंत 108 या 112 पर कॉल करें या नजदीकी आपातकालीन वार्ड में जाएं।',
          spokenText: 'यह एक आपातकालीन स्थिति हो सकती है। कृपया तुरंत 108 पर कॉल करें।',
          suggestedAction: 'emergency',
          isEmergency: true,
        };
      }
      return {
        text: 'This appears to be an urgent medical situation. Please dial 108 or 112 immediately for emergency medical response.',
        spokenText: 'This appears to be an urgent situation. Please call 108 or 112 immediately.',
        suggestedAction: 'emergency',
        isEmergency: true,
      };
    }

    if (qLower.includes('token') || qLower.includes('queue') || qLower.includes('wait') || qLower.includes('number')) {
      if (language === 'hi') {
        return {
          text: 'आप मरीज डैशबोर्ड में अपना सक्रिय टोकन नंबर और अनुमानित प्रतीक्षा समय देख सकते हैं। नया टोकन लेने के लिए क्लिनिकल इनटेक शुरू करें।',
          spokenText: 'आप मरीज डैशबोर्ड में अपना टोकन नंबर देख सकते हैं।',
          suggestedAction: 'tokens',
          isEmergency: false,
        };
      }
      return {
        text: 'You can check your active OPD queue token and live wait time in your Patient Dashboard. To generate a new token, please start clinical intake.',
        spokenText: 'You can view your active OPD queue token in your Patient Dashboard.',
        suggestedAction: 'tokens',
        isEmergency: false,
      };
    }

    if (qLower.includes('doctor') || qLower.includes('cardiology') || qLower.includes('opd') || qLower.includes('timing')) {
      if (language === 'hi') {
        return {
          text: 'हमारे पास कार्डियोलॉजी, जनरल मेडिसिन और अन्य विभागों के विशेषज्ञ डॉक्टर उपलब्ध हैं। ओपीडी का समय सुबह 9 बजे से दोपहर 1 बजे तक है।',
          spokenText: 'हमारे विशेषज्ञ डॉक्टर उपलब्ध हैं। ओपीडी सुबह नौ बजे से दोपहर एक बजे तक है।',
          suggestedAction: 'search',
          isEmergency: false,
        };
      }
      return {
        text: 'Certified specialist doctors are available across Cardiology, General Medicine, and Orthopedics. OPD hours are 9:00 AM to 1:00 PM.',
        spokenText: 'Specialist doctors are available across Cardiology and General Medicine. OPD hours are 9 AM to 1 PM.',
        suggestedAction: 'search',
        isEmergency: false,
      };
    }

    if (qLower.includes('intake') || qLower.includes('symptom') || qLower.includes('pain') || qLower.includes('fever') || qLower.includes('cough') || qLower.includes('start')) {
      if (language === 'hi') {
        return {
          text: 'मैं आपके लक्षणों का विवरण दर्ज करने में मदद कर सकता हूँ। अपनी केस शीट तैयार करने के लिए क्लिनिकल इनटेक शुरू करें।',
          spokenText: 'अपनी केस शीट तैयार करने और टोकन पाने के लिए क्लिनिकल इनटेक शुरू करें।',
          suggestedAction: 'intake',
          isEmergency: false,
        };
      }
      return {
        text: 'I can help record your symptoms and prepare your structured case sheet for the consulting doctor. Click "Start Clinical Intake" to begin.',
        spokenText: 'I can help record your symptoms. Click Start Clinical Intake to prepare your case sheet.',
        suggestedAction: 'intake',
        isEmergency: false,
      };
    }

    // General friendly greeting
    if (language === 'hi') {
      return {
        text: 'नमस्ते! मैं आरोग्यफ़्लो आवाज़ सहायक हूँ। आप मुझसे लक्षणों, ओपीडी टोकन, डॉक्टर या आपातकालीन सहायता के बारे में पूछ सकते हैं।',
        spokenText: 'नमस्ते! मैं आरोग्यफ़्लो आवाज़ सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?',
        suggestedAction: 'none',
        isEmergency: false,
      };
    }
    return {
      text: 'Hello! I am your AarogyaFlow Voice Assistant. You can speak to me about symptoms, OPD tokens, finding doctors, or hospital emergency services.',
      spokenText: 'Hello! I am your AarogyaFlow Voice Assistant. How can I help you today?',
      suggestedAction: 'none',
      isEmergency: false,
    };
  };

  if (!ai) {
    return res.json(getRuleBasedVoiceResponse());
  }

  const voiceSystemPrompt = `You are the AarogyaFlow Voice Assistant, an AI assistant for a Government of India clinical intake portal.
SAFETY RULES:
1. NEVER diagnose a disease, prescribe drugs, or recommend treatment dosages.
2. Keep answers concise (2-3 short, spoken-friendly sentences) suitable for clear text-to-speech playback.
3. If patient mentions chest pain, severe breathlessness, fainting, or acute bleeding, advise emergency helpline 108 immediately.
4. If patient asks about symptoms or seeing a doctor, guide them to start the Clinical Intake to get their OPD token.
5. Answer naturally in the requested language code: "${language}".`;

  try {
    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          { text: voiceSystemPrompt },
          { text: `User voice query: "${query}". Provide a warm, concise answer in language: ${language}.` }
        ],
      });
    });

    const replyText = (response.text || '').trim();
    if (!replyText) {
      return res.json(getRuleBasedVoiceResponse());
    }

    let action: 'intake' | 'emergency' | 'search' | 'tokens' | 'none' = 'none';
    if (isEmergency) action = 'emergency';
    else if (qLower.includes('intake') || qLower.includes('pain') || qLower.includes('fever') || qLower.includes('symptom')) action = 'intake';
    else if (qLower.includes('token') || qLower.includes('queue')) action = 'tokens';
    else if (qLower.includes('doctor') || qLower.includes('hospital')) action = 'search';

    return res.json({
      text: replyText,
      spokenText: replyText.replace(/[*#]/g, ''),
      suggestedAction: action,
      isEmergency,
    });
  } catch (err) {
    console.warn('Gemini voice assist unavailable, using intelligent rule-based speech response.');
    return res.json(getRuleBasedVoiceResponse());
  }
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AarogyaFlow Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
