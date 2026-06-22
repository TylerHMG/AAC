import type { Tile } from '../types/module';

// High-frequency CORE vocabulary (spec §3 / Tier 0) — the words that cover most
// of everyday communication, so a fresh "Core words" grid is useful immediately.
// Categorised by the Fitzgerald Key so colours are correct out of the box:
//   pronoun (yellow) · verb (green) · describing (blue) · place (purple) ·
//   social / little / question words (pink).
// Nouns are intentionally light here — specific nouns live in topic grids.
export const coreVocab: Tile[] = [
  // people / pronouns
  { id: 'core.i', label: 'I', spokenText: 'I', symbolKeyword: 'i', category: 'pronoun' },
  { id: 'core.you', label: 'you', spokenText: 'you', symbolKeyword: 'you', category: 'pronoun' },
  { id: 'core.it', label: 'it', spokenText: 'it', symbolKeyword: 'it', category: 'pronoun' },
  { id: 'core.we', label: 'we', spokenText: 'we', symbolKeyword: 'we', category: 'pronoun' },
  { id: 'core.my', label: 'my', spokenText: 'my', symbolKeyword: 'my', category: 'pronoun' },
  { id: 'core.that', label: 'that', spokenText: 'that', symbolKeyword: 'that', category: 'pronoun' },

  // actions / verbs
  { id: 'core.want', label: 'want', spokenText: 'want', symbolKeyword: 'want', category: 'verb' },
  { id: 'core.go', label: 'go', spokenText: 'go', symbolKeyword: 'go', category: 'verb' },
  // symbolId pins the red stop-sign pictogram (keyword "stop" resolves to a bus stop).
  { id: 'core.stop', label: 'stop', spokenText: 'stop', symbolKeyword: 'stop', symbolId: 8289, category: 'verb' },
  { id: 'core.like', label: 'like', spokenText: 'like', symbolKeyword: 'like', category: 'verb' },
  { id: 'core.help', label: 'help', spokenText: 'I need help', symbolKeyword: 'help', category: 'verb' },
  { id: 'core.have', label: 'have', spokenText: 'have', symbolKeyword: 'have', category: 'verb' },
  { id: 'core.do', label: 'do', spokenText: 'do', symbolKeyword: 'do', category: 'verb' },
  { id: 'core.get', label: 'get', spokenText: 'get', symbolKeyword: 'get', category: 'verb' },
  { id: 'core.make', label: 'make', spokenText: 'make', symbolKeyword: 'make', category: 'verb' },
  { id: 'core.eat', label: 'eat', spokenText: 'eat', symbolKeyword: 'eat', category: 'verb' },
  { id: 'core.drink', label: 'drink', spokenText: 'drink', symbolKeyword: 'drink', category: 'verb' },
  { id: 'core.play', label: 'play', spokenText: 'play', symbolKeyword: 'play', category: 'verb' },
  { id: 'core.look', label: 'look', spokenText: 'look', symbolKeyword: 'look', category: 'verb' },

  // describing words
  { id: 'core.more', label: 'more', spokenText: 'more', symbolKeyword: 'more', category: 'describing' },
  { id: 'core.big', label: 'big', spokenText: 'big', symbolKeyword: 'big', category: 'describing' },
  { id: 'core.little', label: 'little', spokenText: 'little', symbolKeyword: 'little', category: 'describing' },
  { id: 'core.good', label: 'good', spokenText: 'good', symbolKeyword: 'good', category: 'describing' },
  { id: 'core.all', label: 'all', spokenText: 'all', symbolKeyword: 'all', category: 'describing' },

  // places
  { id: 'core.here', label: 'here', spokenText: 'here', symbolKeyword: 'here', category: 'place' },
  { id: 'core.there', label: 'there', spokenText: 'there', symbolKeyword: 'there', category: 'place' },

  // social / little / question words
  { id: 'core.yes', label: 'yes', spokenText: 'yes', symbolKeyword: 'yes', category: 'social' },
  { id: 'core.no', label: 'no', spokenText: 'no', symbolKeyword: 'no', category: 'social' },
  { id: 'core.please', label: 'please', spokenText: 'please', symbolKeyword: 'please', category: 'social' },
  { id: 'core.done', label: 'done', spokenText: 'all done', symbolKeyword: 'finished', category: 'social' },
  { id: 'core.not', label: 'not', spokenText: 'not', symbolKeyword: 'no', category: 'social' },
  { id: 'core.what', label: 'what', spokenText: 'what', symbolKeyword: 'question', category: 'social' },
  { id: 'core.where', label: 'where', spokenText: 'where', symbolKeyword: 'where', category: 'social' },
  { id: 'core.again', label: 'again', spokenText: 'again', symbolKeyword: 'repeat', category: 'social' },
  { id: 'core.hi', label: 'hi', spokenText: 'hi', symbolKeyword: 'hello', category: 'social' },
];
