// Text-to-speech (spec Tier 0): browser Web Speech API to start. Speaks both
// individual tiles and the assembled message-bar phrase.
//
// Later tiers (spec §5 offline architecture) add pre-generated, cached audio so
// speech works offline where the Web Speech API is unavailable. That fits behind
// this same small surface — add a `speak()` path that plays cached audio first
// and falls back to synthesis.

class TtsService {
  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  get available(): boolean {
    return this.synth !== null;
  }

  speak(text: string): void {
    const trimmed = text.trim();
    if (!this.synth || trimmed === '') return;
    // Cancel anything in progress so taps feel responsive rather than queuing.
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    this.synth.speak(utterance);
  }

  cancel(): void {
    this.synth?.cancel();
  }
}

export const tts = new TtsService();
