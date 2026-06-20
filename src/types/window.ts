import type { ModuleType } from './module';

// Every module can be a window EXCEPT the message bar (which is a fixed frame).
export type WindowType = Exclude<ModuleType, 'messageBar'>;

// Per-window configuration (settings that belong to one window instance).
export interface WindowConfig {
  // AI window: how many suggestions this box generates.
  aiCount?: number;
}

// One open window in a layout. Content (tiles, AI generation, suggestions) comes
// from the shared stores; the instance records identity + type + title + its own
// config.
export interface WindowInstance {
  id: string;
  type: WindowType;
  title: string;
  config?: WindowConfig;
}
