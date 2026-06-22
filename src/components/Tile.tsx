import type { Tile as TileModel } from '../types/module';
import { SymbolView } from './SymbolView';

interface TileButtonProps {
  tile: TileModel;
  onSelect: (tile: TileModel) => void;
  // When editing, tapping the tile opens the editor instead of speaking.
  editMode?: boolean;
  onEdit?: (tile: TileModel) => void;
  // Text-only: hide the symbol and show a larger word (per-window "Symbols" off).
  textOnly?: boolean;
}

// A single selectable tile: symbol + label, colour-coded by word type. A real
// <button> with a large tap target for limited motor control (spec §5). In edit
// mode it shows a pencil badge and routes taps to the editor. With `textOnly` it
// drops the symbol and shows a bigger word, for windows set to text display.
export function TileButton({ tile, onSelect, editMode, onEdit, textOnly }: TileButtonProps) {
  const editing = Boolean(editMode && onEdit);
  return (
    <button
      type="button"
      className={`tile tile--${tile.category}${textOnly ? ' tile--pred' : ''}${editing ? ' tile--editing' : ''}`}
      onClick={() => (editing ? onEdit!(tile) : onSelect(tile))}
      aria-label={editing ? `Edit ${tile.label}` : tile.label}
    >
      {editing && <span className="tile__edit-badge" aria-hidden>✎</span>}
      {!textOnly && <SymbolView keyword={tile.symbolKeyword} symbolId={tile.symbolId} />}
      <span className={`tile__label${textOnly ? ' tile__label--pred' : ''}`}>{tile.label}</span>
    </button>
  );
}
