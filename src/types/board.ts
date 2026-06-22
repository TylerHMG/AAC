import type { MosaicNode } from 'react-mosaic-component';
import type { WordCategory } from './module';
import type { WindowInstance } from './window';

// Bump when the persisted shape changes in a way that needs migration.
// v3: grids own their tiles per-window; the shared board.coreTiles is gone.
export const SCHEMA_VERSION = 3;

export type ThemeMode = 'light' | 'dark';

// Text-to-speech voice/delivery (spec Tier 2 "Speech customization").
export interface SpeechSettings {
  voiceURI: string | null; // null = the device's default voice
  rate: number; // 0.5–2 (1 = normal)
  pitch: number; // 0–2 (1 = normal)
  volume: number; // 0–1
}

// Settings shared across ALL boards (device/person preferences), not per board.
export interface GlobalSettings {
  speechBarSize: number;
  bottomButtonSize: number;
  categoryColors: Record<WordCategory, string>;
  theme: ThemeMode;
  speech: SpeechSettings;
}

// A board = one saved workspace: its tiling layout + its windows. Each grid
// window owns its own tiles (WindowInstance.tiles). Colours/sizes are global.
export interface Board {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  layoutTree: MosaicNode<string> | null;
  windows: Record<string, WindowInstance>;
}

// The top-level document: which board is active, their order, and global settings.
// Each board is stored under its own key; this only references them by id.
export interface AppDoc {
  schemaVersion: number;
  activeBoardId: string;
  boardOrder: string[];
  settings: GlobalSettings;
}
