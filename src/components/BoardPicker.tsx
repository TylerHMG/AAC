import { useState } from 'react';
import { useBoard } from '../state/BoardStore';
import type { BoardSource } from '../state/BoardStore';
import { TEMPLATES } from '../data/templates';
import { SCHEMA_VERSION } from '../types/board';
import { Modal } from './Modal';

// Full-screen board picker. In use mode, tapping a board switches to it. In
// arrange (edit) mode it also offers create / rename / duplicate / delete /
// reorder. Destructive actions confirm and can never leave zero boards.
export function BoardPicker({ onClose }: { onClose: () => void }) {
  const {
    boards,
    activeBoardId,
    editMode,
    switchBoard,
    createBoard,
    renameBoard,
    duplicateBoard,
    deleteBoard,
    reorderBoards,
    importBoards,
  } = useBoard();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [source, setSource] = useState('blank');

  function handleSwitch(id: string) {
    switchBoard(id);
    onClose();
  }

  function move(index: number, dir: -1 | 1) {
    const ids = boards.map((b) => b.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorderBoards(ids);
  }

  function handleRename(id: string, current: string) {
    const next = window.prompt('Rename board', current);
    if (next != null && next.trim() !== '') renameBoard(id, next);
  }

  function handleDelete(id: string, label: string) {
    if (window.confirm(`Delete “${label}”? This can't be undone.`)) deleteBoard(id);
  }

  function handleExport() {
    const data = JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: Date.now(), boards }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `aac-boards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file later
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : Array.isArray(data?.boards) ? data.boards : null;
      if (!incoming || incoming.length === 0) {
        window.alert('That file doesn’t look like an AAC boards export.');
        return;
      }
      importBoards(incoming);
      onClose(); // land on the first imported board
    } catch {
      window.alert('Could not read that file.');
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const from: BoardSource =
      source === 'blank' ? 'blank' : source === 'duplicate' ? 'duplicate' : { templateId: source.slice(4) };
    createBoard({ name: name.trim() || 'New board', from });
    onClose(); // land on the new board
  }

  if (creating) {
    return (
      <Modal title="New board" onClose={() => setCreating(false)}>
        <form className="board-new" onSubmit={handleCreate}>
          <label className="field">
            <span className="field__label">Board name</span>
            <input
              className="field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home, School, Snacks"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field__label">Start from</span>
            <select className="field__input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="blank">Blank</option>
              <option value="duplicate">Copy of current board</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={`tpl:${t.id}`}>
                  Template — {t.name}
                </option>
              ))}
            </select>
          </label>
          <div className="board-new__actions">
            <button type="button" className="ctrl" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="ctrl ctrl--speak">
              Create board
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Boards" onClose={onClose} wide>
      <div className="boards">
        {!editMode && (
          <p className="boards__hint">Tap a board to switch. Hold “Edit” to add or change boards.</p>
        )}
        <div className="boards__grid">
          {boards.map((b, i) => {
            const isActive = b.id === activeBoardId;
            return (
              <div key={b.id} className={`board-card${isActive ? ' board-card--active' : ''}`}>
                <button
                  type="button"
                  className="board-card__pick"
                  onClick={() => handleSwitch(b.id)}
                  aria-label={`Switch to ${b.name}`}
                >
                  <span className="board-card__name">{b.name}</span>
                  {isActive && <span className="board-card__badge">Current</span>}
                </button>

                {editMode && (
                  <div className="board-card__tools">
                    <button
                      type="button"
                      className="ctrl ctrl--icon"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${b.name} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ctrl ctrl--icon"
                      onClick={() => move(i, 1)}
                      disabled={i === boards.length - 1}
                      aria-label={`Move ${b.name} down`}
                    >
                      ↓
                    </button>
                    <button type="button" className="ctrl" onClick={() => handleRename(b.id, b.name)}>
                      Rename
                    </button>
                    <button type="button" className="ctrl" onClick={() => duplicateBoard(b.id)}>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="ctrl ctrl--danger"
                      onClick={() => handleDelete(b.id, b.name)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {editMode && (
            <button
              type="button"
              className="board-card board-card--new"
              onClick={() => {
                setName('');
                setSource('blank');
                setCreating(true);
              }}
            >
              ＋ New board
            </button>
          )}
        </div>

        {editMode && (
          <div className="boards__footer">
            <button type="button" className="ctrl" onClick={handleExport} disabled={boards.length === 0}>
              ⬇ Export all
            </button>
            <label className="ctrl">
              ⬆ Import
              <input type="file" accept="application/json,.json" onChange={handleImport} hidden />
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
