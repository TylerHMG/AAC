import type { WindowInstance, WindowType } from '../types/window';

// The window types a caregiver can open from the palette. Add an entry here once
// a window's content component is implemented in WindowContent.tsx.
export interface WindowDef {
  type: WindowType;
  title: string;
  // Minimum width as a percentage of the workspace (react-mosaic resizes in %).
  minSizePercent: number;
}

export const WINDOW_LIBRARY: WindowDef[] = [
  { type: 'grid', title: 'Grid', minSizePercent: 15 },
  { type: 'aiGrid', title: 'AI words', minSizePercent: 20 },
  { type: 'autocomplete', title: 'Word prediction', minSizePercent: 12 },
];

export function windowTitle(type: WindowType): string {
  return WINDOW_LIBRARY.find((w) => w.type === type)?.title ?? type;
}

// Tile windows are the ones whose content is a grid of tiles, so they support
// the Text/Symbols display toggle.
const TILE_WINDOWS: WindowType[] = ['grid', 'aiGrid', 'autocomplete'];

export function isTileWindow(type: WindowType): boolean {
  return TILE_WINDOWS.includes(type);
}

// Whether a window currently shows symbols on its tiles. Defaults differ by type:
// symbols on for core/AI (symbol-first AAC), off for prediction (fast text).
export function showsSymbols(win: WindowInstance): boolean {
  return win.config?.showSymbols ?? win.type !== 'autocomplete';
}
