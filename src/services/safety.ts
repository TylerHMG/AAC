// AI output safety filter (spec Tier 0 / §6).
//
// Users are often children and vulnerable adults, so generated suggestions must
// be screened before they can ever render. This is a deliberately simple,
// transparent first-pass blocklist — easy to read and audit. It is NOT a
// complete safety solution.
//
// NEXT ITERATION: strengthen this, e.g. a larger/maintained word list, fuzzy
// matching for obfuscation, and/or a second lightweight model pass that
// classifies each tile. Keep it as a pure function so it stays easy to test.

// Word-boundary blocklist. Lowercased; matched against whole words so "grass"
// is not blocked by "ass", etc. Kept short and obvious on purpose.
const BLOCKED_WORDS: readonly string[] = [
  'kill',
  'die',
  'death',
  'gun',
  'weapon',
  'knife',
  'blood',
  'sex',
  'sexual',
  'nude',
  'naked',
  'drug',
  'drugs',
  'alcohol',
  'beer',
  'wine',
  'suicide',
  'hate',
];

const blockedSet = new Set(BLOCKED_WORDS);

// Returns true if the text is safe to display.
export function isSafeText(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z']+/g);
  if (!words) return true;
  return !words.some((word) => blockedSet.has(word));
}
