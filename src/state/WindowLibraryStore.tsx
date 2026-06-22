import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { WindowPreset } from '../types/windowLibrary';
import { loadUserWindows, saveUserWindows } from '../services/idb';

// The user's saved/favorited windows — GLOBAL (shared across all boards),
// persisted on-device. Builtins are code; this store holds only user presets.
// Capturing a live window into a preset happens at the call site (it needs the
// active board); this store just owns the list + CRUD.

export type NewUserWindow = Omit<WindowPreset, 'id' | 'source' | 'createdAt' | 'updatedAt'>;

interface LibraryState {
  userWindows: WindowPreset[];
  addToLibrary: (preset: NewUserWindow) => void;
  renameUserWindow: (id: string, name: string) => void;
  deleteUserWindow: (id: string) => void;
  reorderUserWindows: (ids: string[]) => void;
  libHydrated: boolean;
}

const LibraryContext = createContext<LibraryState | null>(null);

function newPresetId(): string {
  return `uw.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

export function WindowLibraryProvider({ children }: { children: ReactNode }) {
  const [userWindows, setUserWindows] = useState<WindowPreset[]>([]);
  const [libHydrated, setLibHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadUserWindows().then((list) => {
      if (!alive) return;
      setUserWindows(list);
      hydratedRef.current = true;
      setLibHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!hydratedRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveUserWindows(userWindows), 400);
  }, [userWindows]);

  const addToLibrary = useCallback((preset: NewUserWindow) => {
    const now = Date.now();
    const full: WindowPreset = {
      ...preset,
      id: newPresetId(),
      source: 'user',
      name: preset.name.trim() || 'Saved window',
      config: preset.config ? { ...preset.config } : undefined,
      tiles: preset.tiles ? preset.tiles.map((t) => ({ ...t })) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    setUserWindows((prev) => [...prev, full]);
  }, []);

  const renameUserWindow = useCallback((id: string, name: string) => {
    setUserWindows((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p)),
    );
  }, []);

  const deleteUserWindow = useCallback((id: string) => {
    setUserWindows((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorderUserWindows = useCallback((ids: string[]) => {
    setUserWindows((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return ids.map((id) => byId.get(id)).filter((p): p is WindowPreset => Boolean(p));
    });
  }, []);

  const value = useMemo<LibraryState>(
    () => ({ userWindows, addToLibrary, renameUserWindow, deleteUserWindow, reorderUserWindows, libHydrated }),
    [userWindows, addToLibrary, renameUserWindow, deleteUserWindow, reorderUserWindows, libHydrated],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useWindowLibrary(): LibraryState {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useWindowLibrary must be used within a WindowLibraryProvider');
  return ctx;
}
