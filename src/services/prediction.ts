import { get, set } from 'idb-keyval';
import type { WordCategory } from '../types/module';
import { BIGRAMS, STARTERS, CATEGORY_OF, UNI_WEIGHT } from '../data/lexicon';

// Word-prediction engine (next-word, AAC-style). Blends three signals:
//   1. static curated bigrams   — sensible grammar out of the box
//   2. static unigram frequency — a gentle fallback so the grid always fills
//   3. an on-device LEARNED model (the user's own word + word-pair counts),
//      weighted higher so predictions personalise with use.
//
// PRIVACY (spec §6): the learned model lives only in IndexedDB on this device.
// Nothing here ever leaves the device — unlike the AI grid, there is no network.

export interface Suggestion {
  word: string;
  category: WordCategory;
}

interface LearnedModel {
  uni: Record<string, number>;
  bi: Record<string, Record<string, number>>;
}

const STORE_KEY = 'aac.predict.v1';
const model: LearnedModel = { uni: {}, bi: {} };

// Scoring weights. Learned signals outrank the static base so the predictor
// adapts to the user; the unigram frequency fill is gentle so context still wins.
const STATIC_BI = 6; // × (rank position) for a curated next-word
const LEARN_BI = 40; // × learned count for a context→word pair
const STATIC_UNI = 0.05; // × lexicon frequency weight
const LEARN_UNI = 4; // × learned word count
const STARTER_BASE = 6; // × (rank position) for empty-buffer starters

// --- change notification (so the window re-predicts after async load / learning)
let version = 0;
const listeners = new Set<() => void>();
function notify() {
  version += 1;
  listeners.forEach((l) => l());
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getVersion(): number {
  return version;
}

// Load any saved learned model once, then tell listeners to re-predict.
void (async () => {
  try {
    const saved = await get<LearnedModel>(STORE_KEY);
    if (saved && saved.uni && saved.bi) {
      model.uni = saved.uni;
      model.bi = saved.bi;
      notify();
    }
  } catch {
    // storage unavailable — keep working with the static base only.
  }
})();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void set(STORE_KEY, model).catch(() => {});
  }, 1000);
}

// Split text into lowercase word tokens (keeps apostrophes for contractions).
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

// Record a completed utterance into the learned model (unigrams + bigrams).
export function learnSequence(tokens: string[]): void {
  if (tokens.length === 0) return;
  let prev: string | null = null;
  for (const w of tokens) {
    model.uni[w] = (model.uni[w] ?? 0) + 1;
    if (prev) {
      const followers = (model.bi[prev] ??= {});
      followers[w] = (followers[w] ?? 0) + 1;
    }
    prev = w;
  }
  persist();
  notify();
}

// Rank next-word candidates for the given context (the words said so far).
export function predict(context: string[], limit = 12): Suggestion[] {
  const last = context.length > 0 ? context[context.length - 1] : null;
  const scores = new Map<string, number>();
  const add = (w: string, s: number) => {
    if (w) scores.set(w, (scores.get(w) ?? 0) + s);
  };

  if (last) {
    const staticNext = BIGRAMS[last];
    if (staticNext) staticNext.forEach((w, i) => add(w, (staticNext.length - i) * STATIC_BI));
    const learnedNext = model.bi[last];
    if (learnedNext) for (const w in learnedNext) add(w, learnedNext[w] * LEARN_BI);
  } else {
    STARTERS.forEach((w, i) => add(w, (STARTERS.length - i) * STARTER_BASE));
  }

  // Frequency fill — gentle, so context-driven candidates stay on top.
  for (const w in UNI_WEIGHT) add(w, UNI_WEIGHT[w] * STATIC_UNI);
  for (const w in model.uni) add(w, model.uni[w] * LEARN_UNI);

  if (last) scores.delete(last); // never suggest repeating the previous word

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => ({ word, category: CATEGORY_OF[word] ?? 'social' }));
}
