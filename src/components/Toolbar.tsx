import { useBoard } from '../state/BoardStore';
import { useLongPress } from '../hooks/useLongPress';

// Bottom control bar (the spec's anchored "controls strip"). In use mode: a
// hold-to-edit lock and the keyboard. In arrange mode: add-window, settings,
// done, and the keyboard.
export function Toolbar({
  onOpenKeyboard,
  onOpenSettings,
  onOpenPalette,
}: {
  onOpenKeyboard: () => void;
  onOpenSettings: () => void;
  onOpenPalette: () => void;
}) {
  const { editMode, setEditMode } = useBoard();
  const holdToEdit = useLongPress(() => setEditMode(true));

  return (
    <div className="toolbar">
      {editMode ? (
        <>
          <button type="button" className="ctrl" onClick={onOpenPalette}>
            ＋ Window
          </button>
          <button type="button" className="ctrl" onClick={onOpenSettings}>
            ⚙ Settings
          </button>
          <button type="button" className="ctrl ctrl--speak" onClick={() => setEditMode(false)}>
            ✓ Done
          </button>
        </>
      ) : (
        // Hold to enter arrange/edit mode — prevents accidental taps.
        <button
          type="button"
          className="ctrl ctrl--hold"
          {...holdToEdit}
          aria-label="Hold to edit"
          title="Hold to edit"
        >
          ✎ Hold to edit
        </button>
      )}

      <button type="button" className="ctrl" onClick={onOpenKeyboard} aria-label="Open keyboard">
        ⌨ Keyboard
      </button>
    </div>
  );
}
