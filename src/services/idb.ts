import { get, set } from 'idb-keyval';

// On-device persistence in IndexedDB (spec §6.2 / §7: local-only storage, no
// backend). idb-keyval is a tiny, well-tested wrapper over IndexedDB.
const KEY = 'aac.workspace.v1';

export async function loadWorkspace<T>(): Promise<T | null> {
  try {
    return ((await get(KEY)) as T) ?? null;
  } catch {
    return null;
  }
}

export async function saveWorkspace<T>(state: T): Promise<void> {
  try {
    await set(KEY, state);
  } catch {
    // storage unavailable / quota — keep working in-memory.
  }
}
