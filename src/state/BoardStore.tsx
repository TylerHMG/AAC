import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getLeaves } from 'react-mosaic-component';
import type { MosaicNode } from 'react-mosaic-component';
import type { Tile, TileDraft, WordCategory } from '../types/module';
import type { WindowInstance, WindowType } from '../types/window';
import type { AppDoc, Board, GlobalSettings, SpeechSettings, ThemeMode } from '../types/board';
import { SCHEMA_VERSION } from '../types/board';
import type { WindowPreset } from '../types/windowLibrary';
import { coreVocab } from '../data/coreVocab';
import { DEFAULT_CATEGORY_COLORS } from '../data/categories';
import { windowTitle } from '../data/windowLibrary';
import { DEFAULT_TEMPLATE, TEMPLATES, cloneTemplate } from '../data/templates';
import { applyCategoryColors } from '../services/colors';
import { tts } from '../services/tts';
import {
  loadAppDoc,
  saveAppDoc,
  saveBoard,
  deleteBoardRecord,
  loadBoards,
  loadLegacyWorkspace,
} from '../services/idb';

// Workspace store: multiple boards plus GLOBAL settings (colours/sizes/theme).
// Each board is a tiling layout + windows; every GRID window owns its own tiles
// (there is no shared "core" vocabulary — "Core words" is just a grid preset).
// Persisted to IndexedDB: one app doc + one record per board. Edit mode is
// session-only.

export type { ThemeMode } from '../types/board';

export const DEFAULT_AI_COUNT = 9; // per-AI-window default generate count
export const AI_COUNT_MIN = 4;
export const AI_COUNT_MAX = 20;

export const DEFAULT_PREDICT_COUNT = 10; // per-prediction-window default
export const PREDICT_COUNT_MIN = 4;
export const PREDICT_COUNT_MAX = 24;

const DEFAULT_SPEECHBAR = 80;
export const SPEECHBAR_MIN = 80;
export const SPEECHBAR_MAX = 220;
export const SPEECHBAR_STEP = 8;

const DEFAULT_BOTTOMBTN = 44;
export const BOTTOMBTN_MIN = 44;
export const BOTTOMBTN_MAX = 100;
export const BOTTOMBTN_STEP = 4;

export type BoardSource = 'blank' | 'duplicate' | { templateId: string };

interface BoardState {
  // Layout (windowed workspace) — reads/writes the ACTIVE board.
  layoutTree: MosaicNode<string> | null;
  windows: Record<string, WindowInstance>;
  setLayoutTree: (tree: MosaicNode<string> | null) => void;
  openWindow: (type: WindowType) => void;
  closeWindow: (id: string) => void;
  applyTemplate: (templateId: string) => void;
  updateWindowConfig: (id: string, patch: WindowInstance['config']) => void;
  addWindowFromPreset: (preset: WindowPreset) => void;

  // Per-grid-window tiles (each grid instance owns its own).
  addWindowTile: (windowId: string, draft: TileDraft) => void;
  updateWindowTile: (windowId: string, tile: Tile) => void;
  removeWindowTile: (windowId: string, tileId: string) => void;

  // Global settings (shared across all boards)
  speechBarSize: number;
  setSpeechBarSize: (n: number) => void;
  bottomButtonSize: number;
  setBottomButtonSize: (n: number) => void;
  categoryColors: Record<WordCategory, string>;
  setCategoryColor: (category: WordCategory, color: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  speech: SpeechSettings;
  updateSpeech: (patch: Partial<SpeechSettings>) => void;

  // Boards
  boards: Board[]; // in board order
  activeBoardId: string;
  switchBoard: (id: string) => void;
  createBoard: (opts: { name: string; from: BoardSource }) => void;
  renameBoard: (id: string, name: string) => void;
  duplicateBoard: (id: string) => void;
  deleteBoard: (id: string) => void;
  reorderBoards: (ids: string[]) => void;
  importBoards: (incoming: Array<Partial<Board>>) => void;

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

function clampFloat(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

// Speech (TTS) ranges.
export const RATE_MIN = 0.5;
export const RATE_MAX = 2;
export const PITCH_MIN = 0;
export const PITCH_MAX = 2;

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

function newBoardId(): string {
  return `board.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueWindowId(windows: Record<string, WindowInstance>, type: WindowType): string {
  let id: string = type;
  let n = 2;
  while (windows[id]) id = `${type}-${n++}`;
  return id;
}

function defaultSpeech(): SpeechSettings {
  return { voiceURI: null, rate: 1, pitch: 1, volume: 1 };
}

function defaultSettings(): GlobalSettings {
  return {
    speechBarSize: DEFAULT_SPEECHBAR,
    bottomButtonSize: DEFAULT_BOTTOMBTN,
    categoryColors: { ...DEFAULT_CATEGORY_COLORS },
    theme: 'light',
    speech: defaultSpeech(),
  };
}

function mergeSettings(s?: Partial<GlobalSettings>): GlobalSettings {
  const base = defaultSettings();
  if (!s) return base;
  return {
    speechBarSize:
      typeof s.speechBarSize === 'number' ? clampInt(s.speechBarSize, SPEECHBAR_MIN, SPEECHBAR_MAX) : base.speechBarSize,
    bottomButtonSize:
      typeof s.bottomButtonSize === 'number'
        ? clampInt(s.bottomButtonSize, BOTTOMBTN_MIN, BOTTOMBTN_MAX)
        : base.bottomButtonSize,
    categoryColors: { ...base.categoryColors, ...(s.categoryColors ?? {}) },
    theme: s.theme === 'dark' ? 'dark' : 'light',
    speech: {
      voiceURI: typeof s.speech?.voiceURI === 'string' ? s.speech.voiceURI : null,
      rate: clampFloat(s.speech?.rate, RATE_MIN, RATE_MAX, 1),
      pitch: clampFloat(s.speech?.pitch, PITCH_MIN, PITCH_MAX, 1),
      volume: clampFloat(s.speech?.volume, 0, 1, 1),
    },
  };
}

function freshCoreTiles(): Tile[] {
  return coreVocab.map((t) => ({ ...t }));
}

type BoardContent = Pick<Board, 'layoutTree' | 'windows'>;

// Grid windows that have no tiles yet get seeded with the general vocabulary
// (used when building a board from a template / default).
function seedGrids(windows: Record<string, WindowInstance>): void {
  for (const w of Object.values(windows)) {
    if (w.type === 'grid' && !w.tiles) w.tiles = freshCoreTiles();
  }
}

function defaultContent(): BoardContent {
  const { tree, windows } = cloneTemplate(DEFAULT_TEMPLATE);
  seedGrids(windows);
  return { layoutTree: tree, windows };
}

function templateContent(templateId: string): BoardContent {
  const t = TEMPLATES.find((x) => x.id === templateId) ?? DEFAULT_TEMPLATE;
  const { tree, windows } = cloneTemplate(t);
  seedGrids(windows);
  return { layoutTree: tree, windows };
}

function blankContent(): BoardContent {
  return { layoutTree: null, windows: {} };
}

function cloneWindows(windows: Record<string, WindowInstance>): Record<string, WindowInstance> {
  return Object.fromEntries(
    Object.values(windows).map((w) => [
      w.id,
      {
        ...w,
        config: w.config ? { ...w.config } : undefined,
        tiles: w.tiles ? w.tiles.map((t) => ({ ...t })) : undefined,
      },
    ]),
  );
}

function cloneContent(src: Board): BoardContent {
  return {
    layoutTree: src.layoutTree ? (JSON.parse(JSON.stringify(src.layoutTree)) as MosaicNode<string>) : null,
    windows: cloneWindows(src.windows),
  };
}

function makeBoard(name: string, content: BoardContent): Board {
  const now = Date.now();
  return { id: newBoardId(), name, createdAt: now, updatedAt: now, ...content };
}

function defaultBoard(): Board {
  return makeBoard('My board', defaultContent());
}

// ---- Migration (v1/v2 → v3) -------------------------------------------------
// Older boards: a shared board.coreTiles + 'coreGrid' windows. Convert each
// coreGrid → 'grid' owning its OWN copy of the vocabulary; drop coreTiles.
interface StoredWindow {
  id: string;
  type: string; // may be a legacy type like 'coreGrid'
  title: string;
  config?: WindowInstance['config'];
  tiles?: Tile[];
}

interface StoredBoard {
  id?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  layoutTree?: MosaicNode<string> | null;
  windows?: Record<string, StoredWindow>;
  coreTiles?: Tile[];
}

function migrateBoard(raw: StoredBoard): Board {
  const now = Date.now();
  const srcWindows = raw.windows ?? {};
  const windows: Record<string, WindowInstance> = {};
  for (const key of Object.keys(srcWindows)) {
    const w: StoredWindow = { ...srcWindows[key] };
    let tiles = w.tiles;
    let type = w.type;
    if (type === 'coreGrid') {
      type = 'grid';
      if (!Array.isArray(tiles)) {
        tiles = Array.isArray(raw.coreTiles) ? raw.coreTiles.map((t) => ({ ...t })) : freshCoreTiles();
      }
    }
    windows[w.id] = {
      id: w.id,
      type: type as WindowInstance['type'],
      title: w.title,
      config: w.config,
      tiles,
    };
  }
  return {
    id: raw.id ?? newBoardId(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Board',
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    layoutTree: raw.layoutTree ?? null,
    windows,
  };
}

interface Workspace {
  boards: Record<string, Board>;
  boardOrder: string[];
  activeBoardId: string;
  settings: GlobalSettings;
}

function initialWorkspace(): Workspace {
  const board = defaultBoard();
  return { boards: { [board.id]: board }, boardOrder: [board.id], activeBoardId: board.id, settings: defaultSettings() };
}

interface LegacyWorkspace {
  layoutTree?: MosaicNode<string> | null;
  windows?: Record<string, StoredWindow>;
  coreTiles?: Tile[];
  speechBarSize?: number;
  bottomButtonSize?: number;
  categoryColors?: Record<WordCategory, string>;
  theme?: ThemeMode;
}

// Memoised so it runs exactly once even if React (StrictMode in dev) invokes the
// hydrate effect twice — otherwise migration's IDB writes could race.
let hydrateOnce: Promise<Workspace> | null = null;
function getWorkspaceOnce(): Promise<Workspace> {
  if (!hydrateOnce) hydrateOnce = hydrateWorkspace();
  return hydrateOnce;
}

async function hydrateWorkspace(): Promise<Workspace> {
  // 1. New system already present (migrate per-board to current schema).
  const app = await loadAppDoc();
  if (app && Array.isArray(app.boardOrder)) {
    const raw = (await loadBoards(app.boardOrder)) as unknown as StoredBoard[];
    if (raw.length > 0) {
      const migrated = raw.map(migrateBoard);
      const boards = Object.fromEntries(migrated.map((b) => [b.id, b]));
      const boardOrder = app.boardOrder.filter((id) => boards[id]);
      const activeBoardId = boards[app.activeBoardId] ? app.activeBoardId : boardOrder[0];
      const settings = mergeSettings(app.settings);
      if ((app.schemaVersion ?? 1) < SCHEMA_VERSION) {
        migrated.forEach((b) => void saveBoard(b));
        void saveAppDoc({ schemaVersion: SCHEMA_VERSION, activeBoardId, boardOrder, settings });
      }
      return { boards, boardOrder, activeBoardId, settings };
    }
  }

  // 2. Legacy single-workspace blob → one board, then migrate grids.
  const legacy = await loadLegacyWorkspace<LegacyWorkspace>();
  if (legacy) {
    let board = migrateBoard({
      id: newBoardId(),
      name: 'My board',
      layoutTree: legacy.layoutTree !== undefined ? legacy.layoutTree : null,
      windows: legacy.windows,
      coreTiles: legacy.coreTiles,
    });
    if (Object.keys(board.windows).length === 0) board = makeBoard('My board', defaultContent());
    const settings = mergeSettings({
      speechBarSize: legacy.speechBarSize,
      bottomButtonSize: legacy.bottomButtonSize,
      categoryColors: legacy.categoryColors,
      theme: legacy.theme,
    });
    await saveBoard(board);
    await saveAppDoc({ schemaVersion: SCHEMA_VERSION, activeBoardId: board.id, boardOrder: [board.id], settings });
    return { boards: { [board.id]: board }, boardOrder: [board.id], activeBoardId: board.id, settings };
  }

  // 3. Fresh install.
  const board = defaultBoard();
  const settings = defaultSettings();
  await saveBoard(board);
  await saveAppDoc({ schemaVersion: SCHEMA_VERSION, activeBoardId: board.id, boardOrder: [board.id], settings });
  return { boards: { [board.id]: board }, boardOrder: [board.id], activeBoardId: board.id, settings };
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const init = useRef<Workspace>();
  if (!init.current) init.current = initialWorkspace();

  const [boards, setBoards] = useState<Record<string, Board>>(init.current.boards);
  const [boardOrder, setBoardOrder] = useState<string[]>(init.current.boardOrder);
  const [activeBoardId, setActiveBoardId] = useState<string>(init.current.activeBoardId);
  const [settings, setSettings] = useState<GlobalSettings>(init.current.settings);
  const [editMode, setEditMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  const boardsRef = useRef(boards);
  const boardOrderRef = useRef(boardOrder);
  const activeIdRef = useRef(activeBoardId);
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);
  useEffect(() => {
    boardOrderRef.current = boardOrder;
  }, [boardOrder]);
  useEffect(() => {
    activeIdRef.current = activeBoardId;
  }, [activeBoardId]);

  useEffect(() => {
    let alive = true;
    getWorkspaceOnce().then((w) => {
      if (!alive) return;
      setBoards(w.boards);
      setBoardOrder(w.boardOrder);
      setActiveBoardId(w.activeBoardId);
      setSettings(w.settings);
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const appSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!hydratedRef.current) return;
    clearTimeout(appSaveTimer.current);
    appSaveTimer.current = setTimeout(() => {
      const doc: AppDoc = { schemaVersion: SCHEMA_VERSION, activeBoardId, boardOrder, settings };
      void saveAppDoc(doc);
    }, 400);
  }, [activeBoardId, boardOrder, settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    applyCategoryColors(settings.categoryColors, settings.theme === 'dark');
  }, [settings.categoryColors, settings.theme]);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--speechbar-h', `${settings.speechBarSize}px`);
    root.setProperty('--bottombtn-h', `${settings.bottomButtonSize}px`);
  }, [settings.speechBarSize, settings.bottomButtonSize]);

  // Push TTS settings into the speech service so every utterance uses them.
  useEffect(() => {
    tts.configure(settings.speech);
  }, [settings.speech]);

  const boardSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleSaveBoard = useCallback((id: string) => {
    if (!hydratedRef.current) return;
    clearTimeout(boardSaveTimers.current[id]);
    boardSaveTimers.current[id] = setTimeout(() => {
      const b = boardsRef.current[id];
      if (b) void saveBoard(b);
    }, 500);
  }, []);

  const mutateActive = useCallback(
    (updater: (b: Board) => Board) => {
      const id = activeIdRef.current;
      setBoards((prev) => {
        const cur = prev[id];
        if (!cur) return prev;
        return { ...prev, [id]: { ...updater(cur), updatedAt: Date.now() } };
      });
      scheduleSaveBoard(id);
    },
    [scheduleSaveBoard],
  );

  // ---- Layout / window actions ----
  const setLayoutTree = useCallback(
    (tree: MosaicNode<string> | null) => {
      mutateActive((b) => {
        const leaves = new Set(tree ? getLeaves(tree) : []);
        const windows = Object.fromEntries(Object.entries(b.windows).filter(([id]) => leaves.has(id)));
        return { ...b, layoutTree: tree, windows };
      });
    },
    [mutateActive],
  );

  const insertWindow = (b: Board, instance: WindowInstance): Board => {
    const windows = { ...b.windows, [instance.id]: instance };
    const layoutTree: MosaicNode<string> =
      b.layoutTree == null
        ? instance.id
        : { direction: 'row', first: b.layoutTree, second: instance.id, splitPercentage: 60 };
    return { ...b, windows, layoutTree };
  };

  const openWindow = useCallback(
    (type: WindowType) => {
      mutateActive((b) => {
        const id = uniqueWindowId(b.windows, type);
        const instance: WindowInstance = { id, type, title: windowTitle(type) };
        if (type === 'aiGrid') instance.config = { aiCount: DEFAULT_AI_COUNT };
        if (type === 'autocomplete') instance.config = { predictCount: DEFAULT_PREDICT_COUNT };
        if (type === 'grid') instance.tiles = [];
        return insertWindow(b, instance);
      });
    },
    [mutateActive],
  );

  const addWindowFromPreset = useCallback(
    (preset: WindowPreset) => {
      mutateActive((b) => {
        const id = uniqueWindowId(b.windows, preset.type);
        const instance: WindowInstance = { id, type: preset.type, title: preset.name };
        if (preset.config) instance.config = { ...preset.config };
        if (preset.type === 'grid') instance.tiles = (preset.tiles ?? []).map((t) => ({ ...t, id: newTileId() }));
        return insertWindow(b, instance);
      });
    },
    [mutateActive],
  );

  const closeWindow = useCallback(
    (id: string) => {
      mutateActive((b) => {
        const windows = { ...b.windows };
        delete windows[id];
        return { ...b, windows, layoutTree: removeLeaf(b.layoutTree, id) };
      });
    },
    [mutateActive],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      if (!TEMPLATES.some((x) => x.id === templateId)) return;
      const { layoutTree, windows } = templateContent(templateId);
      mutateActive((b) => ({ ...b, layoutTree, windows }));
    },
    [mutateActive],
  );

  const updateWindowConfig = useCallback(
    (id: string, patch: WindowInstance['config']) => {
      mutateActive((b) => {
        const win = b.windows[id];
        if (!win) return b;
        return { ...b, windows: { ...b.windows, [id]: { ...win, config: { ...win.config, ...patch } } } };
      });
    },
    [mutateActive],
  );

  // ---- Per-grid-window tiles ----
  const addWindowTile = useCallback(
    (windowId: string, draft: TileDraft) => {
      mutateActive((b) => {
        const w = b.windows[windowId];
        if (!w) return b;
        const tiles = [...(w.tiles ?? []), { ...draft, id: newTileId() }];
        return { ...b, windows: { ...b.windows, [windowId]: { ...w, tiles } } };
      });
    },
    [mutateActive],
  );

  const updateWindowTile = useCallback(
    (windowId: string, tile: Tile) => {
      mutateActive((b) => {
        const w = b.windows[windowId];
        if (!w) return b;
        const tiles = (w.tiles ?? []).map((t) => (t.id === tile.id ? tile : t));
        return { ...b, windows: { ...b.windows, [windowId]: { ...w, tiles } } };
      });
    },
    [mutateActive],
  );

  const removeWindowTile = useCallback(
    (windowId: string, tileId: string) => {
      mutateActive((b) => {
        const w = b.windows[windowId];
        if (!w) return b;
        const tiles = (w.tiles ?? []).filter((t) => t.id !== tileId);
        return { ...b, windows: { ...b.windows, [windowId]: { ...w, tiles } } };
      });
    },
    [mutateActive],
  );

  // ---- Global settings ----
  const setSpeechBarSize = useCallback((n: number) => {
    setSettings((s) => ({ ...s, speechBarSize: clampInt(n, SPEECHBAR_MIN, SPEECHBAR_MAX) }));
  }, []);
  const setBottomButtonSize = useCallback((n: number) => {
    setSettings((s) => ({ ...s, bottomButtonSize: clampInt(n, BOTTOMBTN_MIN, BOTTOMBTN_MAX) }));
  }, []);
  const setCategoryColor = useCallback((category: WordCategory, color: string) => {
    setSettings((s) => ({ ...s, categoryColors: { ...s.categoryColors, [category]: color } }));
  }, []);
  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((s) => ({ ...s, theme }));
  }, []);
  const updateSpeech = useCallback((patch: Partial<SpeechSettings>) => {
    setSettings((s) => ({ ...s, speech: { ...s.speech, ...patch } }));
  }, []);

  // ---- Board management ----
  const switchBoard = useCallback((id: string) => {
    if (boardsRef.current[id]) setActiveBoardId(id);
  }, []);

  const createBoard = useCallback((opts: { name: string; from: BoardSource }) => {
    const { name, from } = opts;
    let content: BoardContent;
    if (from === 'blank') content = blankContent();
    else if (from === 'duplicate') {
      const src = boardsRef.current[activeIdRef.current];
      content = src ? cloneContent(src) : defaultContent();
    } else content = templateContent(from.templateId);

    const board = makeBoard(name.trim() || 'New board', content);
    setBoards((prev) => ({ ...prev, [board.id]: board }));
    setBoardOrder((prev) => [...prev, board.id]);
    setActiveBoardId(board.id);
    void saveBoard(board);
  }, []);

  const renameBoard = useCallback(
    (id: string, name: string) => {
      setBoards((prev) => {
        const b = prev[id];
        if (!b) return prev;
        return { ...prev, [id]: { ...b, name: name.trim() || b.name, updatedAt: Date.now() } };
      });
      scheduleSaveBoard(id);
    },
    [scheduleSaveBoard],
  );

  const duplicateBoard = useCallback((id: string) => {
    const src = boardsRef.current[id];
    if (!src) return;
    const board = makeBoard(`${src.name} copy`, cloneContent(src));
    setBoards((prev) => ({ ...prev, [board.id]: board }));
    setBoardOrder((prev) => {
      const idx = prev.indexOf(id);
      const next = [...prev];
      next.splice(idx === -1 ? prev.length : idx + 1, 0, board.id);
      return next;
    });
    setActiveBoardId(board.id);
    void saveBoard(board);
  }, []);

  const deleteBoard = useCallback((id: string) => {
    const oldOrder = boardOrderRef.current;
    const remaining = oldOrder.filter((x) => x !== id);
    if (remaining.length === 0) {
      const board = defaultBoard();
      setBoards({ [board.id]: board });
      setBoardOrder([board.id]);
      setActiveBoardId(board.id);
      void saveBoard(board);
    } else {
      setBoards((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setBoardOrder(remaining);
      if (activeIdRef.current === id) {
        const idx = oldOrder.indexOf(id);
        const neighbor = remaining[Math.max(0, idx - 1)] ?? remaining[0];
        setActiveBoardId(neighbor);
      }
    }
    void deleteBoardRecord(id);
  }, []);

  const reorderBoards = useCallback((ids: string[]) => {
    setBoardOrder(ids);
  }, []);

  const importBoards = useCallback((incoming: Array<Partial<Board>>) => {
    const created = incoming
      .filter((b) => Boolean(b) && typeof b === 'object')
      .map((raw) => {
        const m = migrateBoard({ ...(raw as StoredBoard), id: newBoardId() });
        const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Imported board';
        return { ...m, name, createdAt: Date.now(), updatedAt: Date.now() };
      });
    if (created.length === 0) return;
    setBoards((prev) => ({ ...prev, ...Object.fromEntries(created.map((b) => [b.id, b])) }));
    setBoardOrder((prev) => [...prev, ...created.map((b) => b.id)]);
    setActiveBoardId(created[0].id);
    created.forEach((b) => void saveBoard(b));
  }, []);

  const resetAll = useCallback(() => {
    const oldIds = boardOrderRef.current;
    const board = defaultBoard();
    setBoards({ [board.id]: board });
    setBoardOrder([board.id]);
    setActiveBoardId(board.id);
    setSettings(defaultSettings());
    void saveBoard(board);
    oldIds.forEach((id) => void deleteBoardRecord(id));
  }, []);

  const activeBoard = boards[activeBoardId] ?? boardOrder.map((id) => boards[id]).find(Boolean);
  const orderedBoards = useMemo(
    () => boardOrder.map((id) => boards[id]).filter((b): b is Board => Boolean(b)),
    [boardOrder, boards],
  );

  const value = useMemo<BoardState>(
    () => ({
      layoutTree: activeBoard?.layoutTree ?? null,
      windows: activeBoard?.windows ?? {},
      setLayoutTree,
      openWindow,
      closeWindow,
      applyTemplate,
      updateWindowConfig,
      addWindowFromPreset,
      addWindowTile,
      updateWindowTile,
      removeWindowTile,
      speechBarSize: settings.speechBarSize,
      setSpeechBarSize,
      bottomButtonSize: settings.bottomButtonSize,
      setBottomButtonSize,
      categoryColors: settings.categoryColors,
      setCategoryColor,
      theme: settings.theme,
      setTheme,
      speech: settings.speech,
      updateSpeech,
      boards: orderedBoards,
      activeBoardId,
      switchBoard,
      createBoard,
      renameBoard,
      duplicateBoard,
      deleteBoard,
      reorderBoards,
      importBoards,
      editMode,
      setEditMode,
      hydrated,
      resetAll,
    }),
    [
      activeBoard,
      settings,
      orderedBoards,
      activeBoardId,
      setLayoutTree,
      openWindow,
      closeWindow,
      applyTemplate,
      updateWindowConfig,
      addWindowFromPreset,
      addWindowTile,
      updateWindowTile,
      removeWindowTile,
      setSpeechBarSize,
      setBottomButtonSize,
      setCategoryColor,
      setTheme,
      updateSpeech,
      switchBoard,
      createBoard,
      renameBoard,
      duplicateBoard,
      deleteBoard,
      reorderBoards,
      importBoards,
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
