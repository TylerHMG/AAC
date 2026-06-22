import { useState } from 'react';
import { useBoard } from '../state/BoardStore';
import { BoardPicker } from './BoardPicker';

// Header control that shows the current board name and opens the board picker.
// Switching is allowed in use mode; managing boards is gated to arrange mode
// inside the picker.
export function BoardSwitcher() {
  const { boards, activeBoardId } = useBoard();
  const [open, setOpen] = useState(false);
  const active = boards.find((b) => b.id === activeBoardId);

  return (
    <>
      <button
        type="button"
        className="board-switcher"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Current board: ${active?.name ?? 'Board'}. Switch board`}
      >
        <span className="board-switcher__name">{active?.name ?? 'Board'}</span>
        <span className="board-switcher__caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && <BoardPicker onClose={() => setOpen(false)} />}
    </>
  );
}
