import type { ModuleType } from './module';
import type { Tile } from './module';

// Every module can be a window EXCEPT the message bar (which is a fixed frame).
export type WindowType = Exclude<ModuleType, 'messageBar'>;

// Per-window configuration (settings that belong to one window instance).
export interface WindowConfig {
  // AI window: how many suggestions this box generates.
  aiCount?: number;
  // Word-prediction window: how many predicted words it shows.
  predictCount?: number;
  // Tile windows (core / AI / prediction): show a symbol on each tile, or text
  // only. Defaults differ by window type (symbols on for core/AI, off for
  // prediction), so this is only stored once the user toggles it.
  showSymbols?: boolean;
}

// One open window in a layout. A grid window OWNS its tiles (per-instance); AI
// and prediction windows generate content at runtime from their config.
export interface WindowInstance {
  id: string;
  type: WindowType;
  title: string;
  config?: WindowConfig;
  // Grid windows ('grid'): the tiles this grid shows. Each instance is independent.
  tiles?: Tile[];
}
