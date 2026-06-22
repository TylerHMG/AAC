import type { Tile } from './module';
import type { WindowType, WindowConfig } from './window';

// A reusable, named window definition the user can add to any board. Builtin
// presets ship with the app; user presets are saved/favorited on-device.
export interface WindowPreset {
  id: string;
  name: string;
  source: 'builtin' | 'user';
  type: WindowType;
  config?: WindowConfig;
  // Content snapshot for grid presets (the words the grid carries).
  tiles?: Tile[];
  // Short, one-line description shown on the card.
  hint?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const WINDOW_LIBRARY_VERSION = 1;
