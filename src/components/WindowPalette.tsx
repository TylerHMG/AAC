import { useState } from 'react';
import type { Tile } from '../types/module';
import { useBoard } from '../state/BoardStore';
import { useWindowLibrary } from '../state/WindowLibraryStore';
import { BUILTIN_PRESETS } from '../data/builtinWindows';
import { TEMPLATES } from '../data/templates';
import type { WindowPreset } from '../types/windowLibrary';
import { Modal } from './Modal';

// A small colour-coded thumbnail of a grid's tiles, so a window is recognisable
// at a glance. Lightweight (no symbol loading) — coloured cells + tiny labels.
function GridPreview({ tiles }: { tiles?: Tile[] }) {
  if (!tiles || tiles.length === 0) {
    return <span className="wpreview wpreview--empty">Empty grid</span>;
  }
  return (
    <span className="wpreview" aria-hidden>
      {tiles.slice(0, 12).map((t) => (
        <span
          key={t.id}
          className="wpreview__cell"
          style={{ background: `var(--cat-${t.category}-fill)`, color: `var(--cat-${t.category}-label)` }}
        >
          {t.label}
        </span>
      ))}
    </span>
  );
}

const SMART_ICON: Record<string, string> = { aiGrid: '✨', autocomplete: '↻' };

// Window library. Opens to "My windows" (saved/favorited); "＋ Add windows" opens
// the premade catalogue (Grids + Smart windows + Layouts).
export function WindowPalette({ onClose }: { onClose: () => void }) {
  const { addWindowFromPreset, applyTemplate } = useBoard();
  const { userWindows, addToLibrary, renameUserWindow, deleteUserWindow } = useWindowLibrary();
  const [view, setView] = useState<'mine' | 'add'>('mine');

  const gridPresets = BUILTIN_PRESETS.filter((p) => p.type === 'grid');
  const smartPresets = BUILTIN_PRESETS.filter((p) => p.type !== 'grid');

  function add(preset: WindowPreset) {
    addWindowFromPreset(preset);
    onClose();
  }
  // A preset is favorited when a saved window of the same type + name exists.
  function favoriteOf(preset: WindowPreset): WindowPreset | undefined {
    return userWindows.find((u) => u.type === preset.type && u.name.toLowerCase() === preset.name.toLowerCase());
  }
  function toggleFavorite(preset: WindowPreset) {
    const existing = favoriteOf(preset);
    if (existing) deleteUserWindow(existing.id);
    else addToLibrary({ name: preset.name, type: preset.type, config: preset.config, tiles: preset.tiles, hint: preset.hint });
  }
  function rename(preset: WindowPreset) {
    const next = window.prompt('Rename window', preset.name);
    if (next != null && next.trim() !== '') renameUserWindow(preset.id, next);
  }
  function remove(preset: WindowPreset) {
    if (window.confirm(`Delete “${preset.name}” from My windows?`)) deleteUserWindow(preset.id);
  }

  // ---- Add-windows catalogue ----
  if (view === 'add') {
    return (
      <Modal title="Add windows" onClose={onClose} wide>
        <div className="wlib">
          <button type="button" className="wlib__back" onClick={() => setView('mine')}>
            ← My windows
          </button>

          <section className="wlib__section">
            <h3 className="wlib__heading">Grids</h3>
            <div className="wlib__grid">
              {gridPresets.map((p) => {
                const fav = Boolean(favoriteOf(p));
                return (
                  <div className="wcard" key={p.id}>
                    <button type="button" className="wcard__pick" onClick={() => add(p)} aria-label={`Add ${p.name}`}>
                      <span className="wcard__name">{p.name}</span>
                      <GridPreview tiles={p.tiles} />
                    </button>
                    <div className="wcard__tools">
                      <button
                        type="button"
                        className={`ctrl${fav ? ' ctrl--fav' : ''}`}
                        onClick={() => toggleFavorite(p)}
                        aria-pressed={fav}
                        aria-label={fav ? `Remove ${p.name} from my windows` : `Save ${p.name} to my windows`}
                      >
                        {fav ? (
                          <>
                            <span className="star-fav" aria-hidden>
                              ★
                            </span>{' '}
                            Saved
                          </>
                        ) : (
                          '☆ Save'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="wlib__section">
            <h3 className="wlib__heading">Smart windows</h3>
            <p className="wlib__subhint">These fill themselves in — nothing to set up or save.</p>
            <div className="wlib__grid">
              {smartPresets.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className="wcard wcard--smart wcard__pick"
                  onClick={() => add(p)}
                  aria-label={`Add ${p.name}`}
                >
                  <span className="wcard__name">
                    <span className="wcard__icon" aria-hidden>
                      {SMART_ICON[p.type] ?? '✨'}
                    </span>{' '}
                    {p.name}
                  </span>
                  {p.hint && <span className="wcard__hint">{p.hint}</span>}
                </button>
              ))}
            </div>
          </section>

          <details className="wlib__layouts">
            <summary>Layouts — replace this whole board</summary>
            <div className="wlib__grid">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="palette__item"
                  onClick={() => {
                    applyTemplate(t.id);
                    onClose();
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </details>
        </div>
      </Modal>
    );
  }

  // ---- My windows (default) ----
  return (
    <Modal title="My windows" onClose={onClose} wide>
      <div className="wlib">
        <div className="wlib__actions">
          <button type="button" className="ctrl ctrl--speak" onClick={() => setView('add')}>
            ＋ Add windows
          </button>
        </div>

        {userWindows.length === 0 ? (
          <p className="wlib__empty">
            No saved windows yet. Tap “＋ Add windows” to add premade ones, or save a window you’ve
            built from its title bar (☆).
          </p>
        ) : (
          <div className="wlib__grid">
            {userWindows.map((p) => (
              <div className="wcard" key={p.id}>
                <button type="button" className="wcard__pick" onClick={() => add(p)} aria-label={`Add ${p.name}`}>
                  <span className="wcard__name">{p.name}</span>
                  {p.type === 'grid' ? (
                    <GridPreview tiles={p.tiles} />
                  ) : (
                    p.hint && <span className="wcard__hint">{p.hint}</span>
                  )}
                </button>
                <div className="wcard__tools">
                  <button type="button" className="ctrl" onClick={() => rename(p)}>
                    Rename
                  </button>
                  <button type="button" className="ctrl ctrl--danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
