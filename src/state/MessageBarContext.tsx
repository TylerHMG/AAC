import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Tile } from '../types/module';
import { tts } from '../services/tts';

// The message bar is the central object that makes a pile of heterogeneous
// modules behave like one device (spec §2.2). Writer modules append to it;
// reader modules (autocomplete, prediction — later tiers) will read from it.

export interface BufferItem {
  // Unique per appended selection (a word may be added more than once).
  key: string;
  label: string;
  spokenText: string;
}

interface MessageBarState {
  items: BufferItem[];
  // Append a tile selection. Speaks the tile immediately (spec: speak individual
  // tiles) and adds it to the assembled phrase.
  append: (tile: Tile) => void;
  // Append free text (from the keyboard module). Speaks it and adds it as one
  // chip in the message bar.
  appendText: (text: string) => void;
  backspace: () => void;
  clear: () => void;
  // Speak the whole assembled phrase (spec: speak assembled phrases).
  speakAll: () => void;
}

const MessageBarContext = createContext<MessageBarState | null>(null);

export function MessageBarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BufferItem[]>([]);

  const append = useCallback((tile: Tile) => {
    tts.speak(tile.spokenText);
    setItems((prev) => [
      ...prev,
      {
        key: `${tile.id}-${Date.now()}-${prev.length}`,
        label: tile.label,
        spokenText: tile.spokenText,
      },
    ]);
  }, []);

  const appendText = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    tts.speak(trimmed);
    setItems((prev) => [
      ...prev,
      { key: `text-${Date.now()}-${prev.length}`, label: trimmed, spokenText: trimmed },
    ]);
  }, []);

  const backspace = useCallback(() => {
    setItems((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    tts.cancel();
    setItems([]);
  }, []);

  const speakAll = useCallback(() => {
    setItems((current) => {
      const phrase = current.map((item) => item.spokenText).join(' ');
      tts.speak(phrase);
      return current;
    });
  }, []);

  const value = useMemo<MessageBarState>(
    () => ({ items, append, appendText, backspace, clear, speakAll }),
    [items, append, appendText, backspace, clear, speakAll],
  );

  return <MessageBarContext.Provider value={value}>{children}</MessageBarContext.Provider>;
}

export function useMessageBar(): MessageBarState {
  const ctx = useContext(MessageBarContext);
  if (!ctx) throw new Error('useMessageBar must be used within a MessageBarProvider');
  return ctx;
}
