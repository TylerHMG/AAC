// The module contract (spec §2.3) — every module declares the same shape so the
// board can host them uniformly. Only a subset of module types is implemented in
// this first draft; the enum lists the full catalogue so the contract is stable
// as later tiers are added.

export type ModuleType =
  | 'messageBar'
  | 'coreGrid'
  | 'aiGrid'
  | 'topicGrid'
  | 'quickPhrases'
  | 'recents'
  | 'keyboard'
  | 'autocomplete'
  | 'nextWord'
  | 'folderLink'
  | 'controls';

// The central design principle (spec §1): rigidity is a feature for muscle
// memory. Anchored modules never move; dynamic modules keep their *region* fixed
// while their *content* swaps.
export type ModuleBehavior = 'anchored' | 'dynamic';

// Almost every module either writes to or reads from the shared message buffer
// (spec §2.2). A few (controls, folder links) do neither.
export type BufferRelationship = 'writes' | 'reads' | 'none';

// Cell-based placement on the coarse board grid (spec §2.1). Not pixel
// positioning — the board reflows by resizing cells, not repositioning modules.
export interface Footprint {
  col: number; // 0-based column of the top-left cell
  row: number; // 0-based row of the top-left cell
  colSpan: number;
  rowSpan: number;
  // Minimum size for responsive collapse on small screens (spec §2.1, §5).
  minColSpan?: number;
  minRowSpan?: number;
}

export interface ModuleContract {
  id: string;
  type: ModuleType;
  title?: string;
  footprint: Footprint;
  behavior: ModuleBehavior;
  // Position in the board-wide switch-scanning traversal (spec §2.4). Declared
  // from day one even though the scanning *interaction* ships in a later tier —
  // it is very hard to retrofit. Lower numbers are visited first.
  scanOrder: number;
  buffer: BufferRelationship;
}

// Word categories follow the Fitzgerald Key colour convention (spec Tier 1).
// Default colours live in data/categories.ts and are user-customizable.
//   pronoun    — People / Pronouns      → Yellow
//   verb       — Verbs / Actions        → Green
//   describing — Adjectives / Descriptors → Blue
//   noun       — Nouns / Objects / Things → Orange
//   place      — Places                 → Purple
//   social     — Prepositions / social / little words → Pink
export type WordCategory =
  | 'pronoun'
  | 'verb'
  | 'describing'
  | 'noun'
  | 'place'
  | 'social';

// A single selectable tile. Displayed label and spoken text are independent
// (spec §2.2): a tile may show "bathroom" but speak a full sentence.
export interface Tile {
  id: string;
  label: string;
  spokenText: string;
  // Keyword handed to the symbol provider — also exactly what the ARASAAC search
  // API expects (spec §7). The provider resolves keyword → pictogram.
  symbolKeyword: string;
  // Optional exact ARASAAC pictogram id, set when a caregiver picks a specific
  // symbol in the tile editor. Takes precedence over symbolKeyword.
  symbolId?: number;
  category: WordCategory;
}

// The fields a caregiver edits when creating/updating a custom tile. id is
// assigned by the store.
export type TileDraft = Omit<Tile, 'id'>;
