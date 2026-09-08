/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Aarogya Voice Assistant (आवाज़ सहायक)
 * Comprehensive, accessible interactive voice assistant supporting 10 Indian languages.
 * Features live Speech Recognition (STT), natural Speech Synthesis (TTS),
 * visual animated audio waveforms, fallback voice queries, and direct portal actions.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  Activity,
  Send,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { SupportedLanguage } from '../../i18n/translations';
import { APP_CONFIG } from '../../config/appConfig';

interface AarogyaVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onNavigateToIntake: (symptom?: string) => void;
  onNavigateToDashboard: () => void;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenText?: string;
  timestamp: string;
  action?: 'intake' | 'emergency' | 'search' | 'tokens' | 'none';
  actionData?: any;
  isEmergency?: boolean;
}

export const AarogyaVoiceAssistant: React.FC<AarogyaVoiceAssistantProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
  onNavigateToIntake,
  onNavigateToDashboard,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  const [micSupported, setMicSupported] = useState<boolean>(true);

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        currentLanguage === 'hi'
          ? 'नमस्ते! मैं लाइफब्रिज आवाज़ सहायक हूँ। आप मुझसे लक्षणों, ओपीडी टोकन, डॉक्टर या आपातकालीन सहायता के बारे में पूछ सकते हैं।'
          : 'Namaste! I am your LifeBridge Voice Assistant. You can speak or ask about symptoms, OPD queue tokens, specialist doctors, or emergency care.',
      spokenText:
        currentLanguage === 'hi'
          ? 'नमस्ते! मैं लाइफब्रिज आवाज़ सहायक हूँ। आप मुझसे अपने लक्षण या टोकन के बारे में पूछ सकते हैं।'
          : 'Namaste! I am your LifeBridge Voice Assistant. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check diagnostics on mount
  useEffect(() => {
    setMicSupported(VoiceService.isSpeechRecognitionSupported());
  }, []);

  // Scroll chat into view on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isListening]);

  // Cleanup audio when closing modal
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      VoiceService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute patient voice or text query
  const handleProcessQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    VoiceService.stopSpeaking();
    setIsSpeaking(false);
    setMicError('');
    setIsProcessing(true);

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTranscript('');

    try {
      const res = await fetch('/api/ai/voice-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText.trim(),
          language: currentLanguage,
        }),
      });

      const data = await res.json();
      const assistantMsg: AssistantMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'I have noted your request. How else may I assist you?',
        spokenText: data.spokenText || data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.suggestedAction || 'none',
        isEmergency: data.isEmergency,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Play audio response if not muted
      if (!isMuted) {
        VoiceService.speakText(
          assistantMsg.spokenText || assistantMsg.text,
          currentLanguage,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err) {
      console.warn('Voice assist request error:', err);
      const fallbackMsg: AssistantMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: 'I can guide you through our clinical intake or connect you with the OPD queue. Please select an option below.',
        spokenText: 'I can guide you through clinical intake or OPD services.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'intake',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Live Microphone Listening
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setMicError('');
    VoiceService.stopSpeaking();
    setIsSpeaking(false);

    const rec = VoiceService.createRecognitionInstance(
      currentLanguage,
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          setIsListening(false);
          handleProcessQuery(text.trim());
        }
      },
      (errMessage: string) => {
        setMicError(errMessage);
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
      } catch (err) {
        setMicError('Could not activate microphone. Click a voice chip or type below.');
        setIsListening(false);
      }
    } else {
      setMicError('Speech recognition is not accessible in this browser frame.');
    }
  };

  // Repeat or Replay audio
  const handleReplayMessage = (msg: AssistantMessage) => {
    VoiceService.stopSpeaking();
    VoiceService.speakText(
      msg.spokenText || msg.text,
      currentLanguage,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Sample quick queries
  const quickVoicePrompts = [
    {
      label: currentLanguage === 'hi' ? 'छाती में तेज दर्द और पसीना' : 'Severe chest pain & breathlessness',
      query: currentLanguage === 'hi' ? 'मुझे छाती में तेज दर्द और पसीना आ रहा है' : 'I have severe chest pain with breathlessness',
    },
    {
      label: currentLanguage === 'hi' ? 'ओपीडी टोकन कैसे प्राप्त करें?' : 'How to get OPD token?',
      query: currentLanguage === 'hi' ? 'ओपीडी टोकन कैसे प्राप्त करें?' : 'How do I take a token for OPD doctor consultation?',
    },
    {
      label: currentLanguage === 'hi' ? 'कार्डियोलॉजी डॉक्टर और समय' : 'Cardiology doctors & timings',
      query: currentLanguage === 'hi' ? 'कार्डियोलॉजी डॉक्टर का समय क्या है?' : 'What are the Cardiology doctor timings?',
    },
    {
      label: currentLanguage === 'hi' ? 'आपातकालीन एम्बुलेंस 108' : 'Emergency ambulance 108',
      query: 'Emergency 108 helpline',
    },
  ];

  return (
    <div
      id="aarogya-voice-assistant-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-assistant-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-assistant-title" className="text-base sm:text-lg font-bold text-white">
                  LifeBridge Voice Assistant
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  आवाज़ सहायक
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 font-medium">
                National Health Portal Multilingual Voice Interface
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Dropdown Selector */}
            <div className="relative">
              <select
                id="voice-assistant-lang-select"
                value={currentLanguage}
                onChange={e => onSelectLanguage(e.target.value as SupportedLanguage)}
                className="bg-white/10 text-white text-xs rounded-xl px-2.5 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {APP_CONFIG.languages.map(l => (
                  <option key={l.code} value={l.code} className="text-slate-900">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => {
                if (!isMuted) VoiceService.stopSpeaking();
                setIsMuted(!isMuted);
              }}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-rose-500/30 border-rose-400/50 text-rose-200'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              aria-label="Close Voice Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Waveform / Listening Banner */}
        <div
          className={`py-3 px-4 border-b flex items-center justify-between text-xs transition-colors ${
            isListening
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isSpeaking
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isListening ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            ) : isSpeaking ? (
              <Volume2 className="w-4 h-4 text-sky-600 animate-pulse" />
            ) : (
              <Activity className="w-4 h-4 text-emerald-600" />
            )}
            <span className="font-semibold">
              {isListening
                ? 'Listening... Speak into your microphone now'
                : isSpeaking
                ? 'Speaking response in chosen language...'
                : isProcessing
                ? 'Analyzing clinical inquiry...'
                : 'Ready for voice query or prompt selection'}
            </span>
          </div>

          {/* Stop audio button if speaking */}
          {isSpeaking && (
            <button
              onClick={() => {
                VoiceService.stopSpeaking();
                setIsSpeaking(false);
              }}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-sky-200 hover:bg-sky-300 text-sky-900 font-bold transition-colors"
            >
              Stop Audio ✕
            </button>
          )}
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs space-y-2.5 shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : msg.isEmergency
                    ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-bl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold leading-relaxed text-xs sm:text-sm">
                    {msg.text}
                  </span>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleReplayMessage(msg)}
                      className="text-slate-400 hover:text-emerald-700 p-1 shrink-0"
                      title="Replay Voice Audio"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Emergency Card if flagged */}
                {msg.isEmergency && (
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
                      <span className="font-bold">National Medical Emergency: 108</span>
                    </div>
                    <a
                      href="tel:108"
                      className="px-2.5 py-1 rounded-lg bg-white text-rose-700 font-bold text-[11px] shadow-xs"
                    >
                      Call 108
                    </a>
                  </div>
                )}

                {/* Direct Action Buttons */}
                {msg.action === 'intake' && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToIntake();
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Start Clinical Case Intake Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {msg.action === 'tokens' && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToDashboard();
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View My Active OPD Token</span>
                    </button>
                  </div>
                )}

                <div className="text-[10px] text-right opacity-60">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Processing bubble */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-2 text-xs text-slate-600">
                <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
                <span>Processing voice inquiry...</span>
              </div>
            </div>
          )}

          {/* Live Transcript during speech */}
          {isListening && transcript && (
            <div className="p-3 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-950 font-medium animate-pulse">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Hearing:</span>
              "{transcript}"
            </div>
          )}

          {/* Microphone Notification / Error */}
          {micError && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{micError}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Tip: You can use the one-touch query chips below or type in the input bar.
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Voice Chips */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider px-1">
            <span>Quick Voice Queries (One-Tap Test)</span>
            <span>{currentLanguage.toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickVoicePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleProcessQuery(p.query)}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-xs font-medium transition-all shadow-2xs flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3 text-emerald-700" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Prominent Microphone Trigger */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center space-x-2.5">
          {/* Microphone Button */}
          <button
            id="voice-assistant-mic-toggle-btn"
            onClick={handleToggleListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Start speaking with microphone'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              id="voice-assistant-text-input"
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleProcessQuery(inputText);
                }
              }}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : 'Type or speak your clinical or OPD question...'
              }
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white pr-10"
            />
            {inputText.trim() && (
              <button
                onClick={() => handleProcessQuery(inputText)}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                title="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
