import { get, set, del } from 'idb-keyval';
import type { AppDoc, Board } from '../types/board';
import type { WindowPreset } from '../types/windowLibrary';

// On-device persistence in IndexedDB (spec §6.2 / §7: local-only storage, no
// backend). idb-keyval is a tiny, well-tested wrapper over IndexedDB.
//
// Storage layout (v2): one app doc holds the board order + active board + global
// settings; each board lives under its own key. This way editing a board only
// rewrites that one record, not every board.
const APP_KEY = 'aac.app.v1';
const LEGACY_KEY = 'aac.workspace.v1'; // v1 single-workspace blob (migrated once)
const boardKey = (id: string) => `aac.board.${id}`;

export async function loadAppDoc(): Promise<AppDoc | null> {
  try {
    return ((await get(APP_KEY)) as AppDoc) ?? null;
  } catch {
    return null;
  }
}

export async function saveAppDoc(doc: AppDoc): Promise<void> {
  try {
    await set(APP_KEY, doc);
  } catch {
    // storage unavailable / quota — keep working in-memory.
  }
}

export async function loadBoard(id: string): Promise<Board | null> {
  try {
    return ((await get(boardKey(id))) as Board) ?? null;
  } catch {
    return null;
  }
}

export async function saveBoard(board: Board): Promise<void> {
  try {
    await set(boardKey(board.id), board);
  } catch {
    // ignore — in-memory state still works.
  }
}

export async function deleteBoardRecord(id: string): Promise<void> {
  try {
    await del(boardKey(id));
  } catch {
    // ignore.
  }
}

// Load several boards in parallel, skipping any that are missing/corrupt.
export async function loadBoards(ids: string[]): Promise<Board[]> {
  const results = await Promise.all(ids.map((id) => loadBoard(id)));
  return results.filter((b): b is Board => b != null);
}

// Read the legacy v1 single-workspace blob (for one-time migration). Left in
// place after migration as a safety backup for one version.
export async function loadLegacyWorkspace<T>(): Promise<T | null> {
  try {
    return ((await get(LEGACY_KEY)) as T) ?? null;
  } catch {
    return null;
  }
}

// The user's saved/favorited windows — GLOBAL (shared across all boards).
const LIBRARY_KEY = 'aac.windowLibrary.v1';

export async function loadUserWindows(): Promise<WindowPreset[]> {
  try {
    const list = (await get(LIBRARY_KEY)) as WindowPreset[] | undefined;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveUserWindows(list: WindowPreset[]): Promise<void> {
  try {
    await set(LIBRARY_KEY, list);
  } catch {
    // ignore.
  }
}

// Ask the browser to mark this site's storage as DURABLE so the saved boards and
// settings aren't auto-evicted under storage pressure or disuse (notably on iOS,
// which otherwise clears IndexedDB for non-persistent sites). Best-effort: the
// browser may grant silently, prompt, or refuse — we never block on it.
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true; // already durable
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
