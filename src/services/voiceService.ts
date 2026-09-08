/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Voice Recognition and Speech Synthesis Service
 * Provides robust Web Speech API with multilingual voice matching (en-IN, hi-IN, etc.)
 * Robust fallback architecture: handles iframe sandboxing, audio context unlocks,
 * audio chime cues, and Chrome garbage-collection speech prevention.
 */

// Define SpeechRecognition interface for browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  webkitAudioContext?: typeof AudioContext;
}

export interface VoiceState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error?: string;
}

// Global active utterance reference to prevent Chrome garbage collection cutoff
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let audioContext: AudioContext | null = null;

// Populate voices as early as possible
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as IWindow).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export const VoiceService = {
  /**
   * Check if browser supports speech recognition
   */
  isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  },

  /**
   * Check if browser supports speech synthesis (TTS)
   */
  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /**
   * Play an audible UI feedback chime (AudioContext tone generator)
   * Ensures users get immediate auditory feedback even if TTS is muted or voice packs missing.
   */
  playChime(type: 'start' | 'stop' | 'success' | 'alert' = 'start'): void {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'start') {
        // Uplifting two-tone chime (Listening started)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'stop') {
        // Soft descending tone (Listening stopped)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'success') {
        // Pleasant success triad
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'alert') {
        // Urgent attention tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(450, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (err) {
      // Non-blocking audio cue
      console.debug('Chime audio feedback error:', err);
    }
  },

  /**
   * Map AarogyaFlow language code to BCP 47 voice locale
   */
  getLanguageLocale(langCode: string): string {
    const map: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      ml: 'ml-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
    };
    return map[langCode] || 'en-IN';
  },

  /**
   * Start listening for voice input
   */
  createRecognitionInstance(
    langCode: string,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (errMessage: string) => void,
    onEnd: () => void
  ): any | null {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not directly supported in this browser. You can click any voice chip or type your response.');
      return null;
    }

    try {
      const win = window as unknown as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = this.getLanguageLocale(langCode);

      recognition.onstart = () => {
        VoiceService.playChime('start');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          onResult(currentText.trim(), Boolean(finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        let msg = 'Voice capture paused.';
        const errType = event.error;

        if (errType === 'not-allowed') {
          msg = 'Microphone permission was not granted or is blocked by the browser. You can click any voice chip to simulate speech or use text.';
        } else if (errType === 'no-speech') {
          msg = 'No speech detected. Please speak clearly into your microphone.';
        } else if (errType === 'audio-capture') {
          msg = 'No microphone hardware detected on this device.';
        } else if (errType === 'network') {
          msg = 'Network connection issue during voice recognition. You can proceed with text input.';
        } else if (errType === 'aborted') {
          return; // Ignore intentional aborts
        }
        onError(msg);
      };

      recognition.onend = () => {
        VoiceService.playChime('stop');
        onEnd();
      };

      return recognition;
    } catch (err) {
      console.warn('Failed to initialize speech recognition:', err);
      onError('Microphone initialisation failed. You can use guided quick chips or text.');
      return null;
    }
  },

  /**
   * Speak clinical questions or assistant answers out loud in chosen language
   */
  speakText(
    text: string,
    langCode: string,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel prior audio and unpause in case browser suspended speech engine
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Strip markdown asterisks or bracket tags before speaking
      const cleanedText = text
        .replace(/\[INTAKE_COMPLETE\]/gi, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s?/g, '')
        .trim();

      if (!cleanedText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = this.getLanguageLocale(langCode);
      utterance.rate = 1.0; // Natural, clear cadence
      utterance.pitch = 1.0;

      // Select suitable Indian or regional voice
      const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
      const locale = this.getLanguageLocale(langCode);
      const matchedVoice =
        voices.find(v => v.lang.toLowerCase() === locale.toLowerCase()) ||
        voices.find(v => v.lang.replace('_', '-').toLowerCase() === locale.toLowerCase()) ||
        voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase())) ||
        voices.find(v => v.lang.toLowerCase().includes('in')) ||
        voices.find(v => v.default);

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        activeUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis playback error event:', e);
        activeUtterance = null;
        if (onEnd) onEnd();
      };

      // Keep reference to prevent GC cutoff in Chromium
      activeUtterance = utterance;

      // Ensure audio context is unlocked
      getAudioContext();

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis playback error:', err);
      activeUtterance = null;
      if (onEnd) onEnd();
    }
  },

  /**
   * Stop any active speech synthesis
   */
  stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    activeUtterance = null;
  },

  /**
   * Quick test check for voice assistant capabilities
   */
  getDiagnostics(): { sttSupported: boolean; ttsSupported: boolean; voicesCount: number } {
    const voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    return {
      sttSupported: this.isSpeechRecognitionSupported(),
      ttsSupported: this.isSpeechSynthesisSupported(),
      voicesCount: voices.length,
    };
  },
};
