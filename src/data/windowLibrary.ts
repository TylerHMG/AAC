import type { WindowType } from '../types/window';

// The window types a caregiver can open from the palette. Add an entry here once
// a window's content component is implemented in WindowContent.tsx.
export interface WindowDef {
  type: WindowType;
  title: string;
  // Minimum width as a percentage of the workspace (react-mosaic resizes in %).
  minSizePercent: number;
}

export const WINDOW_LIBRARY: WindowDef[] = [
  { type: 'coreGrid', title: 'Core words', minSizePercent: 15 },
  { type: 'aiGrid', title: 'AI words', minSizePercent: 20 },
  { type: 'autocomplete', title: 'Word prediction', minSizePercent: 12 },
];

export function windowTitle(type: WindowType): string {
  return WINDOW_LIBRARY.find((w) => w.type === type)?.title ?? type;
}
