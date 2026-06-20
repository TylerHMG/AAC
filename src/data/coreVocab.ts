import type { Tile } from '../types/module';

// High-frequency core vocabulary (spec §3 / Tier 0), categorised by the
// Fitzgerald Key so colours are correct out of the box:
//   pronoun (yellow) · verb (green) · social/little words (pink)
export const coreVocab: Tile[] = [
  { id: 'core.i', label: 'I', spokenText: 'I', symbolKeyword: 'i', category: 'pronoun' },
  { id: 'core.you', label: 'you', spokenText: 'you', symbolKeyword: 'you', category: 'pronoun' },
  { id: 'core.want', label: 'want', spokenText: 'want', symbolKeyword: 'want', category: 'verb' },
  { id: 'core.go', label: 'go', spokenText: 'go', symbolKeyword: 'go', category: 'verb' },
  { id: 'core.stop', label: 'stop', spokenText: 'stop', symbolKeyword: 'stop', category: 'verb' },
  { id: 'core.like', label: 'like', spokenText: 'like', symbolKeyword: 'like', category: 'verb' },
  { id: 'core.help', label: 'help', spokenText: 'I need help', symbolKeyword: 'help', category: 'verb' },
  { id: 'core.more', label: 'more', spokenText: 'more', symbolKeyword: 'more', category: 'social' },
  { id: 'core.yes', label: 'yes', spokenText: 'yes', symbolKeyword: 'yes', category: 'social' },
  { id: 'core.no', label: 'no', spokenText: 'no', symbolKeyword: 'no', category: 'social' },
  { id: 'core.done', label: 'done', spokenText: 'all done', symbolKeyword: 'finished', category: 'social' },
  { id: 'core.please', label: 'please', spokenText: 'please', symbolKeyword: 'please', category: 'social' },
];
