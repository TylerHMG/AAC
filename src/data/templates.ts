import type { MosaicNode } from 'react-mosaic-component';
import type { WindowInstance, WindowType } from '../types/window';
import { windowTitle } from './windowLibrary';

// A starter layout (spec §2.5: templates over blank canvases). A "board" is now
// a saved window layout = the tiling tree + which windows are open.
export interface Template {
  id: string;
  name: string;
  tree: MosaicNode<string> | null;
  windows: Record<string, WindowInstance>;
}

// Single-instance windows use their type as the id.
function win(type: WindowType): WindowInstance {
  return { id: type, type, title: windowTitle(type) };
}

// The main grid in a template — titled "Core words"; its tiles are seeded with
// the general vocabulary when a board is created (see BoardStore).
const coreGridWin: WindowInstance = { id: 'grid', type: 'grid', title: 'Core words' };

export const TEMPLATES: Template[] = [
  {
    id: 'core-ai',
    name: 'Core + AI fringe',
    tree: { direction: 'row', first: 'grid', second: 'aiGrid', splitPercentage: 34 },
    windows: { grid: { ...coreGridWin }, aiGrid: win('aiGrid') },
  },
  {
    id: 'core-ai-predict',
    name: 'Core + AI + prediction',
    tree: {
      direction: 'row',
      first: 'grid',
      second: {
        direction: 'row',
        first: 'aiGrid',
        second: 'autocomplete',
        splitPercentage: 58,
      },
      splitPercentage: 56,
    },
    windows: {
      grid: { ...coreGridWin },
      aiGrid: win('aiGrid'),
      autocomplete: win('autocomplete'),
    },
  },
  {
    id: 'core-predict',
    name: 'Core + prediction',
    tree: { direction: 'row', first: 'grid', second: 'autocomplete', splitPercentage: 60 },
    windows: { grid: { ...coreGridWin }, autocomplete: win('autocomplete') },
  },
];

// New boards / fresh installs open with the three-pane Core + AI + prediction
// layout (the full showcase).
export const DEFAULT_TEMPLATE = TEMPLATES.find((t) => t.id === 'core-ai-predict') ?? TEMPLATES[0];

// Deep-clone a template's layout so edits don't mutate the constant.
export function cloneTemplate(t: Template): { tree: MosaicNode<string> | null; windows: Record<string, WindowInstance> } {
  return {
    tree: t.tree ? (JSON.parse(JSON.stringify(t.tree)) as MosaicNode<string>) : null,
    windows: Object.fromEntries(
      Object.values(t.windows).map((w) => [w.id, { ...w }]),
    ),
  };
}
