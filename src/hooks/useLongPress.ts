import { useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';

// Hold-to-activate. Used for the edit lock (spec Tier 0: gate editing behind a
// long-press so the AAC user can't accidentally enter edit mode and delete
// tiles). Returns pointer handlers to spread onto a button.
export function useLongPress(onLongPress: () => void, ms = 600) {
  const timer = useRef<number | null>(null);

  const start = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      if (timer.current !== null) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onLongPress();
      }, ms);
    },
    [onLongPress, ms],
  );

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
