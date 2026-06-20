import type { WordCategory } from '../types/module';

// The Fitzgerald Key (spec Tier 1) — the colour convention AAC users rely on.
// `color` is the default tile background; it is user-customizable in Settings.
export interface CategoryMeta {
  value: WordCategory;
  label: string;
  hint: string;
  color: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  { value: 'pronoun', label: 'People / Pronouns', hint: 'I, you, Mom', color: '#FFD75E' }, // Yellow
  { value: 'verb', label: 'Actions / Verbs', hint: 'want, go, eat', color: '#8FD18A' }, // Green
  { value: 'describing', label: 'Describing words', hint: 'big, happy, hot', color: '#8CC4EC' }, // Blue
  { value: 'noun', label: 'Things / Objects', hint: 'ball, juice, car', color: '#F6B26B' }, // Orange
  { value: 'place', label: 'Places', hint: 'home, school, park', color: '#C3A0E0' }, // Purple
  { value: 'social', label: 'Social / little words', hint: 'please, hello, in', color: '#F2A9C0' }, // Pink
];

export const CATEGORY_VALUES: WordCategory[] = CATEGORY_META.map((c) => c.value);

export const DEFAULT_CATEGORY_COLORS: Record<WordCategory, string> = Object.fromEntries(
  CATEGORY_META.map((c) => [c.value, c.color]),
) as Record<WordCategory, string>;
