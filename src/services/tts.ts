import type { SpeechSettings } from '../types/board';

// Text-to-speech (spec Tier 0 + Tier 2 "Speech customization"): browser Web
// Speech API. Speaks individual tiles and the assembled message-bar phrase, with
// a user-chosen voice + rate/pitch/volume applied to every utterance.
//
// Settings are pushed in via configure() (from the board store) so callers like
// the message bar don't need to know about them. Later tiers (spec §5 offline)
// can add cached pre-generated audio behind this same small surface.

const DEFAULTS: SpeechSettings = { voiceURI: null, rate: 1, pitch: 1, volume: 1 };

class TtsService {
  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  private settings: SpeechSettings = { ...DEFAULTS };
  private voiceListeners = new Set<() => void>();

  constructor() {
    // Voices often load asynchronously; notify subscribers when they arrive.
    if (this.synth) {
      this.synth.addEventListener('voiceschanged', () => {
        this.voiceListeners.forEach((l) => l());
      });
    }
  }

  get available(): boolean {
    return this.synth !== null;
  }

  // Apply the user's speech settings (called by the board store on change).
  configure(patch: Partial<SpeechSettings>): void {
    this.settings = { ...this.settings, ...patch };
  }

  // Available system voices (may be empty until the first 'voiceschanged').
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices() : [];
  }

  // Subscribe to the voice list becoming available/changing. Returns unsubscribe.
  onVoices(cb: () => void): () => void {
    this.voiceListeners.add(cb);
    return () => {
      this.voiceListeners.delete(cb);
    };
  }

  speak(text: string): void {
    const trimmed = text.trim();
    if (!this.synth || trimmed === '') return;
    // Cancel anything in progress so taps feel responsive rather than queuing.
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    if (this.settings.voiceURI) {
      const voice = this.getVoices().find((v) => v.voiceURI === this.settings.voiceURI);
      if (voice) utterance.voice = voice;
    }
    this.synth.speak(utterance);
  }

  cancel(): void {
    this.synth?.cancel();
  }
}

export const tts = new TtsService();
