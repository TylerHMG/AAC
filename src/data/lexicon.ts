import type { WordCategory } from '../types/module';

// Static base lexicon for word prediction (see prediction.ts). This is the
// "out of the box" knowledge; the on-device learned model is layered on top and
// weighted higher, so the predictor personalises with use.
//
// Words are tagged with their Fitzgerald category so predicted tiles colour
// correctly, and given a rough frequency weight (higher = more common) used as a
// gentle fallback so the grid always fills with useful words.

type Entry = [word: string, category: WordCategory, weight: number];

// Core + high-frequency vocabulary. Weights are rough frequency tiers, not exact.
const FREQ: Entry[] = [
  // pronouns / people
  ['i', 'pronoun', 100], ['you', 'pronoun', 96], ['it', 'pronoun', 82], ['me', 'pronoun', 72],
  ['we', 'pronoun', 60], ['my', 'pronoun', 58], ['this', 'pronoun', 56], ['that', 'pronoun', 56],
  ['they', 'pronoun', 40], ['he', 'pronoun', 36], ['she', 'pronoun', 36], ['your', 'pronoun', 40],
  ['him', 'pronoun', 24], ['her', 'pronoun', 24], ['them', 'pronoun', 22], ['us', 'pronoun', 22],
  ['who', 'pronoun', 30], ['mine', 'pronoun', 18],
  // verbs / actions
  ['want', 'verb', 92], ['is', 'verb', 84], ['do', 'verb', 70], ['need', 'verb', 72],
  ['like', 'verb', 72], ['go', 'verb', 76], ['can', 'verb', 74], ['have', 'verb', 66],
  ['am', 'verb', 60], ['are', 'verb', 60], ['help', 'verb', 62], ['see', 'verb', 54],
  ['get', 'verb', 54], ['stop', 'verb', 54], ['eat', 'verb', 50], ['drink', 'verb', 46],
  ['play', 'verb', 50], ['look', 'verb', 46], ['come', 'verb', 46], ['make', 'verb', 40],
  ['put', 'verb', 40], ['give', 'verb', 40], ['feel', 'verb', 50], ['let', 'verb', 46],
  ['know', 'verb', 46], ['think', 'verb', 36], ['was', 'verb', 40], ['will', 'verb', 46],
  ['did', 'verb', 36], ['open', 'verb', 36], ['turn', 'verb', 36], ['watch', 'verb', 32],
  ['read', 'verb', 30], ['wash', 'verb', 26], ['sleep', 'verb', 30], ['wait', 'verb', 36],
  ['tell', 'verb', 30], ['show', 'verb', 30], ['use', 'verb', 26], ['find', 'verb', 26],
  ['done', 'verb', 54], ['finished', 'verb', 40],
  // describing
  ['more', 'describing', 80], ['all', 'describing', 46], ['good', 'describing', 46],
  ['big', 'describing', 36], ['little', 'describing', 36], ['bad', 'describing', 30],
  ['happy', 'describing', 36], ['sad', 'describing', 32], ['hot', 'describing', 30],
  ['cold', 'describing', 30], ['hurt', 'describing', 32], ['tired', 'describing', 32],
  ['hungry', 'describing', 32], ['thirsty', 'describing', 28], ['sick', 'describing', 26],
  ['some', 'describing', 36], ['funny', 'describing', 22], ['scared', 'describing', 22],
  ['nice', 'describing', 26], ['fast', 'describing', 20], ['slow', 'describing', 20],
  ['new', 'describing', 22], ['done', 'describing', 0], // (done already a verb; harmless dup ignored)
  // nouns / objects
  ['thing', 'noun', 22], ['ball', 'noun', 22], ['book', 'noun', 22], ['toy', 'noun', 24],
  ['water', 'noun', 26], ['food', 'noun', 26], ['juice', 'noun', 22], ['car', 'noun', 20],
  ['dog', 'noun', 20], ['cat', 'noun', 20], ['milk', 'noun', 18], ['snack', 'noun', 22],
  ['tv', 'noun', 22], ['music', 'noun', 20], ['game', 'noun', 22], ['phone', 'noun', 16],
  ['mom', 'noun', 32], ['dad', 'noun', 32], ['name', 'noun', 16], ['time', 'noun', 22],
  ['one', 'noun', 30], ['lunch', 'noun', 18], ['break', 'noun', 20], ['fun', 'noun', 22],
  // places
  ['home', 'place', 32], ['school', 'place', 30], ['park', 'place', 24], ['outside', 'place', 26],
  ['here', 'place', 42], ['there', 'place', 42], ['bed', 'place', 20], ['store', 'place', 20],
  ['inside', 'place', 20], ['bathroom', 'place', 24],
  // social / little words / questions
  ['yes', 'social', 62], ['no', 'social', 62], ['please', 'social', 56], ['not', 'social', 52],
  ['to', 'social', 86], ['the', 'social', 90], ['a', 'social', 80], ['and', 'social', 60],
  ['of', 'social', 42], ['in', 'social', 46], ['on', 'social', 42], ['at', 'social', 34],
  ['with', 'social', 36], ['for', 'social', 36], ['now', 'social', 50], ['again', 'social', 36],
  ['up', 'social', 36], ['down', 'social', 36], ['out', 'social', 36], ['off', 'social', 26],
  ['ok', 'social', 40], ['what', 'social', 56], ['where', 'social', 46], ['when', 'social', 36],
  ['why', 'social', 36], ['how', 'social', 36], ['hi', 'social', 30], ['hello', 'social', 26],
  ['bye', 'social', 22], ['thank', 'social', 30], ['too', 'social', 30], ['but', 'social', 30],
  ['so', 'social', 26], ['because', 'social', 24], ['very', 'social', 24], ['away', 'social', 26],
  // common contractions
  ["i'm", 'verb', 44], ["don't", 'verb', 40], ["it's", 'pronoun', 30], ["let's", 'verb', 36],
  ["can't", 'verb', 28], ["that's", 'pronoun', 26],
];

// Curated next-word table for common AAC contexts (most-likely first).
export const BIGRAMS: Record<string, string[]> = {
  i: ['want', 'need', 'like', 'am', 'can', 'have', 'feel', 'do', 'see', 'know', 'will'],
  "i'm": ['done', 'happy', 'hungry', 'tired', 'sad', 'sick', 'okay'],
  you: ['are', 'want', 'can', 'like', 'have', 'need', 'do', 'feel'],
  we: ['can', 'are', 'go', 'want', 'need', 'will', 'have'],
  it: ['is', 'now', 'please', 'again', 'up', 'off'],
  "it's": ['my', 'a', 'not', 'time', 'fun'],
  they: ['are', 'have', 'want', 'can'],
  want: ['to', 'more', 'it', 'that', 'a', 'the', 'my', 'some'],
  need: ['to', 'help', 'more', 'a', 'the', 'it'],
  like: ['it', 'to', 'that', 'this', 'the', 'more'],
  to: ['go', 'eat', 'play', 'the', 'see', 'drink', 'stop', 'watch', 'have', 'do', 'get'],
  go: ['to', 'home', 'outside', 'there', 'now', 'away'],
  can: ['i', 'you', 'we', 'help', 'have', 'go'],
  have: ['a', 'more', 'it', 'to', 'some', 'fun', 'my'],
  do: ['you', 'it', 'not', 'that', 'i'],
  "don't": ['want', 'like', 'know', 'do'],
  is: ['it', 'that', 'my', 'the', 'good', 'done', 'not', 'here'],
  this: ['is', 'one', 'please'],
  that: ['is', 'one', 'please', 'too'],
  my: ['turn', 'mom', 'dad', 'name', 'ball', 'book'],
  more: ['please', 'food', 'juice', 'time'],
  help: ['me', 'please', 'with'],
  me: ['please', 'now', 'up', 'that'],
  feel: ['happy', 'sad', 'sick', 'tired', 'good', 'bad'],
  am: ['happy', 'hungry', 'done', 'tired', 'sad'],
  are: ['you', 'we', 'they'],
  "let's": ['go', 'play', 'eat', 'do'],
  where: ['is', 'are', 'do'],
  what: ['is', 'do', 'are', 'time'],
  not: ['now', 'that', 'good', 'yet'],
  and: ['then', 'i', 'you', 'more'],
  play: ['with', 'the', 'a', 'outside', 'now'],
  eat: ['it', 'more', 'lunch', 'a', 'my'],
  drink: ['it', 'water', 'more', 'some', 'my'],
  all: ['done', 'gone', 'of'],
  thank: ['you'],
  get: ['it', 'up', 'more', 'a', 'the'],
  see: ['you', 'it', 'the', 'that'],
  put: ['it', 'on', 'in', 'down', 'away'],
  open: ['it', 'the', 'please'],
  turn: ['it', 'on', 'off', 'the'],
  look: ['at', 'it', 'here'],
  come: ['here', 'on', 'with'],
  the: ['ball', 'book', 'one', 'toy', 'bathroom', 'car', 'food'],
  a: ['little', 'lot', 'break', 'turn', 'snack'],
};

// Ordered sentence starters for an empty buffer (most useful first).
export const STARTERS: string[] = [
  'i', 'you', 'it', 'we', "let's", 'can', 'do', 'what', 'where', 'is',
  'the', 'more', 'please', 'help', 'no', 'yes', 'this', 'look', 'go', 'stop',
];

// Derived lookups.
export const CATEGORY_OF: Record<string, WordCategory> = {};
export const UNI_WEIGHT: Record<string, number> = {};
for (const [word, category, weight] of FREQ) {
  if (weight <= 0) continue; // skip the intentional 0-weight dedup row
  if (!(word in CATEGORY_OF)) CATEGORY_OF[word] = category;
  UNI_WEIGHT[word] = Math.max(UNI_WEIGHT[word] ?? 0, weight);
}
