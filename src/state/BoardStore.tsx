import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getLeaves } from 'react-mosaic-component';
import type { MosaicNode } from 'react-mosaic-component';
import type { Tile, TileDraft, WordCategory } from '../types/module';
import type { WindowInstance, WindowType } from '../types/window';
import { coreVocab } from '../data/coreVocab';
import { DEFAULT_CATEGORY_COLORS } from '../data/categories';
import { windowTitle } from '../data/windowLibrary';
import { DEFAULT_TEMPLATE, TEMPLATES, cloneTemplate } from '../data/templates';
import { applyCategoryColors } from '../services/colors';
import { loadWorkspace, saveWorkspace } from '../services/idb';

// Workspace store: the windowed layout (a tiling tree of windows), the shared
// editable vocabulary, AI generation count, and global look/size settings.
// Persisted to IndexedDB (spec §6.2 / §7). Edit mode is session-only.

export const DEFAULT_AI_COUNT = 9; // per-AI-window default generate count
export const AI_COUNT_MIN = 4;
export const AI_COUNT_MAX = 20;

const DEFAULT_SPEECHBAR = 116;
export const SPEECHBAR_MIN = 80;
export const SPEECHBAR_MAX = 220;
export const SPEECHBAR_STEP = 8;

const DEFAULT_BOTTOMBTN = 56;
export const BOTTOMBTN_MIN = 44;
export const BOTTOMBTN_MAX = 100;
export const BOTTOMBTN_STEP = 4;

interface Persisted {
  layoutTree: MosaicNode<string> | null;
  windows: Record<string, WindowInstance>;
  coreTiles: Tile[];
  speechBarSize: number;
  bottomButtonSize: number;
  categoryColors: Record<WordCategory, string>;
}

interface BoardState {
  // Layout (windowed workspace)
  layoutTree: MosaicNode<string> | null;
  windows: Record<string, WindowInstance>;
  setLayoutTree: (tree: MosaicNode<string> | null) => void;
  openWindow: (type: WindowType) => void;
  closeWindow: (id: string) => void;
  applyTemplate: (templateId: string) => void;
  updateWindowConfig: (id: string, patch: WindowInstance['config']) => void;

  // Shared vocabulary (core grid content)
  coreTiles: Tile[];
  addCoreTile: (draft: TileDraft) => void;
  updateCoreTile: (tile: Tile) => void;
  removeCoreTile: (tileId: string) => void;

  // Settings
  speechBarSize: number;
  setSpeechBarSize: (n: number) => void;
  bottomButtonSize: number;
  setBottomButtonSize: (n: number) => void;
  categoryColors: Record<WordCategory, string>;
  setCategoryColor: (category: WordCategory, color: string) => void;

  // Modes & lifecycle
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  hydrated: boolean;
  resetAll: () => void;
}

const BoardContext = createContext<BoardState | null>(null);

function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function defaultState(): Persisted {
  const { tree, windows } = cloneTemplate(DEFAULT_TEMPLATE);
  return {
    layoutTree: tree,
    windows,
    coreTiles: coreVocab.map((t) => ({ ...t })),
    speechBarSize: DEFAULT_SPEECHBAR,
    bottomButtonSize: DEFAULT_BOTTOMBTN,
    categoryColors: { ...DEFAULT_CATEGORY_COLORS },
  };
}

// Merge a loaded blob with defaults so missing keys never crash the app.
function migrate(saved: Partial<Persisted>): Persisted {
  const base = defaultState();
  return {
    layoutTree: saved.layoutTree !== undefined ? saved.layoutTree : base.layoutTree,
    windows: saved.windows ?? base.windows,
    coreTiles: saved.coreTiles ?? base.coreTiles,
    speechBarSize: typeof saved.speechBarSize === 'number' ? saved.speechBarSize : base.speechBarSize,
    bottomButtonSize:
      typeof saved.bottomButtonSize === 'number' ? saved.bottomButtonSize : base.bottomButtonSize,
    categoryColors: { ...base.categoryColors, ...(saved.categoryColors ?? {}) },
  };
}

// Remove a leaf id from the tiling tree, collapsing now-only-child branches.
function removeLeaf(node: MosaicNode<string> | null, id: string): MosaicNode<string> | null {
  if (node == null) return null;
  if (typeof node === 'string') return node === id ? null : node;
  const first = removeLeaf(node.first, id);
  const second = removeLeaf(node.second, id);
  if (first == null) return second;
  if (second == null) return first;
  return { ...node, first, second };
}

let tileSeq = 0;
function newTileId(): string {
  tileSeq += 1;
  return `custom.${Date.now()}.${tileSeq}`;
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted>(defaultState);
  const [editMode, setEditMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Load saved workspace from IndexedDB once.
  useEffect(() => {
    let alive = true;
    loadWorkspace<Partial<Persisted>>().then((saved) => {
      if (!alive) return;
      if (saved) setPersisted(migrate(saved));
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist after hydration so we don't overwrite saved data with defaults.
  useEffect(() => {
    if (!hydratedRef.current) return;
    void saveWorkspace(persisted);
  }, [persisted]);

  useEffect(() => {
    applyCategoryColors(persisted.categoryColors);
  }, [persisted.categoryColors]);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--speechbar-h', `${persisted.speechBarSize}px`);
    root.setProperty('--bottombtn-h', `${persisted.bottomButtonSize}px`);
  }, [persisted.speechBarSize, persisted.bottomButtonSize]);

  const setLayoutTree = useCallback((tree: MosaicNode<string> | null) => {
    setPersisted((prev) => {
      const leaves = new Set(tree ? getLeaves(tree) : []);
      const windows = Object.fromEntries(
        Object.entries(prev.windows).filter(([id]) => leaves.has(id)),
      );
      return { ...prev, layoutTree: tree, windows };
    });
  }, []);

  const openWindow = useCallback((type: WindowType) => {
    setPersisted((prev) => {
      let id: string = type;
      let n = 2;
      while (prev.windows[id]) id = `${type}-${n++}`;
      const instance: WindowInstance = { id, type, title: windowTitle(type) };
      if (type === 'aiGrid') instance.config = { aiCount: DEFAULT_AI_COUNT };
      const windows = { ...prev.windows, [id]: instance };
      const layoutTree: MosaicNode<string> =
        prev.layoutTree == null
          ? id
          : { direction: 'row', first: prev.layoutTree, second: id, splitPercentage: 60 };
      return { ...prev, windows, layoutTree };
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setPersisted((prev) => {
      const windows = { ...prev.windows };
      delete windows[id];
      return { ...prev, windows, layoutTree: removeLeaf(prev.layoutTree, id) };
    });
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const { tree, windows } = cloneTemplate(t);
    setPersisted((prev) => ({ ...prev, layoutTree: tree, windows }));
  }, []);

  const updateWindowConfig = useCallback((id: string, patch: WindowInstance['config']) => {
    setPersisted((prev) => {
      const win = prev.windows[id];
      if (!win) return prev;
      return {
        ...prev,
        windows: { ...prev.windows, [id]: { ...win, config: { ...win.config, ...patch } } },
      };
    });
  }, []);

  const addCoreTile = useCallback((draft: TileDraft) => {
    setPersisted((prev) => ({ ...prev, coreTiles: [...prev.coreTiles, { ...draft, id: newTileId() }] }));
  }, []);

  const updateCoreTile = useCallback((tile: Tile) => {
    setPersisted((prev) => ({
      ...prev,
      coreTiles: prev.coreTiles.map((t) => (t.id === tile.id ? tile : t)),
    }));
  }, []);

  const removeCoreTile = useCallback((tileId: string) => {
    setPersisted((prev) => ({ ...prev, coreTiles: prev.coreTiles.filter((t) => t.id !== tileId) }));
  }, []);

  const setSpeechBarSize = useCallback((n: number) => {
    setPersisted((prev) => ({ ...prev, speechBarSize: clampInt(n, SPEECHBAR_MIN, SPEECHBAR_MAX) }));
  }, []);

  const setBottomButtonSize = useCallback((n: number) => {
    setPersisted((prev) => ({ ...prev, bottomButtonSize: clampInt(n, BOTTOMBTN_MIN, BOTTOMBTN_MAX) }));
  }, []);

  const setCategoryColor = useCallback((category: WordCategory, color: string) => {
    setPersisted((prev) => ({
      ...prev,
      categoryColors: { ...prev.categoryColors, [category]: color },
    }));
  }, []);

  const resetAll = useCallback(() => setPersisted(defaultState()), []);

  const value = useMemo<BoardState>(
    () => ({
      layoutTree: persisted.layoutTree,
      windows: persisted.windows,
      setLayoutTree,
      openWindow,
      closeWindow,
      applyTemplate,
      updateWindowConfig,
      coreTiles: persisted.coreTiles,
      addCoreTile,
      updateCoreTile,
      removeCoreTile,
      speechBarSize: persisted.speechBarSize,
      setSpeechBarSize,
      bottomButtonSize: persisted.bottomButtonSize,
      setBottomButtonSize,
      categoryColors: persisted.categoryColors,
      setCategoryColor,
      editMode,
      setEditMode,
      hydrated,
      resetAll,
    }),
    [
      persisted,
      setLayoutTree,
      openWindow,
      closeWindow,
      applyTemplate,
      updateWindowConfig,
      addCoreTile,
      updateCoreTile,
      removeCoreTile,
      setSpeechBarSize,
      setBottomButtonSize,
      setCategoryColor,
      editMode,
      hydrated,
      resetAll,
    ],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardState {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within a BoardProvider');
  return ctx;
}
