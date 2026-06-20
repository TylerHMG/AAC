import { useState } from 'react';
import type { Tile, TileDraft } from '../../types/module';
import { useBoard } from '../../state/BoardStore';
import { useMessageBar } from '../../state/MessageBarContext';
import { TileButton } from '../Tile';
import { TileEditor } from '../TileEditor';
import { AutoTileGrid } from '../AutoTileGrid';

// Core-grid window: the shared, editable vocabulary (spec Tier 0). Tiles come
// from the workspace store so every core-grid window shows the same words, and
// they auto-size to fill the window.
export function EditableGrid() {
  const { append } = useMessageBar();
  const { coreTiles, editMode, addCoreTile, updateCoreTile, removeCoreTile } = useBoard();

  // null = closed; 'new' = create; a Tile = edit that tile.
  const [editing, setEditing] = useState<Tile | 'new' | null>(null);

  const slots = Math.max(coreTiles.length + (editMode ? 1 : 0), 1);

  function handleSave(draft: TileDraft) {
    if (editing === 'new') addCoreTile(draft);
    else if (editing) updateCoreTile({ ...editing, ...draft });
    setEditing(null);
  }

  function handleDelete() {
    if (editing && editing !== 'new') removeCoreTile(editing.id);
    setEditing(null);
  }

  return (
    <>
      <AutoTileGrid count={slots}>
        {coreTiles.map((tile) => (
          <TileButton
            key={tile.id}
            tile={tile}
            onSelect={append}
            editMode={editMode}
            onEdit={(t) => setEditing(t)}
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
