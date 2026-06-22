import { useState } from 'react';
import type { Tile, TileDraft } from '../../types/module';
import { useBoard } from '../../state/BoardStore';
import { useMessageBar } from '../../state/MessageBarContext';
import { TileButton } from '../Tile';
import { TileEditor } from '../TileEditor';
import { AutoTileGrid } from '../AutoTileGrid';
import { showsSymbols } from '../../data/windowLibrary';

// Grid window: an editable vocabulary that THIS window owns (per-instance tiles).
// "Core words" is just a grid seeded with general vocabulary; topic grids are the
// same component with different tiles. Tiles auto-size to fill the window; symbols
// vs text is toggled from the window title bar (see WindowManager).
export function EditableGrid({ windowId }: { windowId: string }) {
  const { append } = useMessageBar();
  const { editMode, addWindowTile, updateWindowTile, removeWindowTile, windows } = useBoard();

  // null = closed; 'new' = create; a Tile = edit that tile.
  const [editing, setEditing] = useState<Tile | 'new' | null>(null);

  const win = windows[windowId];
  const tiles = win?.tiles ?? [];
  const showSymbols = win ? showsSymbols(win) : true;
  const slots = Math.max(tiles.length + (editMode ? 1 : 0), 1);

  function handleSave(draft: TileDraft) {
    if (editing === 'new') addWindowTile(windowId, draft);
    else if (editing) updateWindowTile(windowId, { ...editing, ...draft });
    setEditing(null);
  }

  function handleDelete() {
    if (editing && editing !== 'new') removeWindowTile(windowId, editing.id);
    setEditing(null);
  }

  return (
    <>
      <AutoTileGrid count={slots}>
        {tiles.map((tile) => (
          <TileButton
            key={tile.id}
            tile={tile}
            onSelect={append}
            editMode={editMode}
            onEdit={(t) => setEditing(t)}
            textOnly={!showSymbols}
          />
        ))}
        {editMode && (
          <button
            type="button"
            className="tile tile--add"
            onClick={() => setEditing('new')}
            aria-label="Add a new tile"
          >
            <span className="tile__symbol" aria-hidden>
              ＋
            </span>
            <span className="tile__label">Add</span>
          </button>
        )}
      </AutoTileGrid>

      {editing && (
        <TileEditor
          tile={editing === 'new' ? null : editing}
          onSave={handleSave}
          onDelete={editing === 'new' ? undefined : handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
