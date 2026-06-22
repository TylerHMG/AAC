import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import type { MosaicBranch, MosaicNode } from 'react-mosaic-component';
import type { WindowInstance } from '../types/window';
import { useBoard } from '../state/BoardStore';
import { useWindowLibrary } from '../state/WindowLibraryStore';
import type { NewUserWindow } from '../state/WindowLibraryStore';
import type { WindowPreset } from '../types/windowLibrary';
import { useIsNarrow } from '../hooks/useMediaQuery';
import { isTileWindow, showsSymbols } from '../data/windowLibrary';
import { SymbolToggle } from './windows/SymbolToggle';
import { WindowContent } from './windows/WindowContent';

// Walk the tiling tree in scan order: top-left → bottom-right (spec §2.4 — for
// switch scanning later, and for stacking on narrow screens now).
function scanOrder(node: MosaicNode<string> | null): string[] {
  if (node == null) return [];
  if (typeof node === 'string') return [node];
  return [...scanOrder(node.first), ...scanOrder(node.second)];
}

interface Library {
  userWindows: WindowPreset[];
  addToLibrary: (p: NewUserWindow) => void;
  deleteUserWindow: (id: string) => void;
}

// A window is "favorited" when a saved window of the same type + name exists.
function isFavorited(win: WindowInstance, userWindows: WindowPreset[]): boolean {
  return userWindows.some((u) => u.type === win.type && u.name.toLowerCase() === win.title.toLowerCase());
}

function toggleFavorite(win: WindowInstance, lib: Library) {
  const matches = lib.userWindows.filter(
    (u) => u.type === win.type && u.name.toLowerCase() === win.title.toLowerCase(),
  );
  if (matches.length) matches.forEach((m) => lib.deleteUserWindow(m.id));
  else lib.addToLibrary({ name: win.title, type: win.type, config: win.config, tiles: win.tiles });
}

// Title-bar favourite toggle (grids only). Filled yellow ★ when saved.
function SaveStar({ win, lib }: { win: WindowInstance; lib: Library }) {
  const fav = isFavorited(win, lib.userWindows);
  return (
    <button
      type="button"
      className={`win-save${fav ? ' win-save--fav' : ''}`}
      onClick={() => toggleFavorite(win, lib)}
      aria-pressed={fav}
      aria-label={fav ? `Remove ${win.title} from my windows` : `Save ${win.title} to my windows`}
      title={fav ? 'Saved to my windows' : 'Save window'}
    >
      {fav ? '★' : '☆'}
    </button>
  );
}

// On narrow screens the workspace stacks vertically in scan order instead of
// tiling (same layout object, different rendering).
function StackedWorkspace() {
  const { layoutTree, windows, editMode, closeWindow, updateWindowConfig } = useBoard();
  const lib = useWindowLibrary();
  const order = scanOrder(layoutTree);

  if (order.length === 0) {
    return <div className="mosaic-zero">No windows open. Hold “Edit”, then add one.</div>;
  }

  return (
    <div className="window-stack">
      {order.map((id) => {
        const win = windows[id];
        if (!win) return null;
        return (
          <section className={`stack-window win--${win.type}`} key={id}>
            {editMode && (
              <header className="win-bar">
                <span className="win-bar__title">{win.title}</span>
                <div className="win-bar__controls">
                  {isTileWindow(win.type) && (
                    <SymbolToggle
                      compact
                      showSymbols={showsSymbols(win)}
                      onChange={(on) => updateWindowConfig(id, { showSymbols: on })}
                    />
                  )}
                  {win.type === 'grid' && <SaveStar win={win} lib={lib} />}
                  <button
                    type="button"
                    className="win-close"
                    onClick={() => closeWindow(id)}
                    aria-label={`Close ${win.title}`}
                  >
                    ✕
                  </button>
                </div>
              </header>
            )}
            <div className="win-body">
              <WindowContent type={win.type} windowId={id} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

// The tiling workspace beneath the fixed message bar. In arrange (edit) mode
// windows show chrome and can be moved/resized/closed; in use mode the layout is
// frozen and chrome is hidden.
export function WindowManager() {
  const { layoutTree, windows, setLayoutTree, editMode, closeWindow, updateWindowConfig } = useBoard();
  const lib = useWindowLibrary();
  const narrow = useIsNarrow(640);

  if (narrow) return <StackedWorkspace />;

  const renderTile = (id: string, path: MosaicBranch[]) => {
    const win = windows[id];
    if (!win) return <div className="win-body" />;

    const content = (
      <div className="win-body">
        <WindowContent type={win.type} windowId={id} />
      </div>
    );

    // Use mode: bare content, no chrome, not draggable.
    if (!editMode) {
      return <div className={`win win--use win--${win.type}`}>{content}</div>;
    }

    // Arrange mode: MosaicWindow gives the draggable title bar (grip) + a close
    // control. Custom toolbarControls avoid the Blueprint icon dependency.
    return (
      <MosaicWindow<string>
        path={path}
        title={win.title}
        className={`win--${win.type}`}
        toolbarControls={
          <>
            {isTileWindow(win.type) && (
              <SymbolToggle
                compact
                showSymbols={showsSymbols(win)}
                onChange={(on) => updateWindowConfig(id, { showSymbols: on })}
              />
            )}
            {win.type === 'grid' && <SaveStar win={win} lib={lib} />}
            <button
              type="button"
              className="win-close"
              onClick={() => closeWindow(id)}
              aria-label={`Close ${win.title}`}
            >
              ✕
            </button>
          </>
        }
      >
        {content}
      </MosaicWindow>
    );
  };

  return (
    <Mosaic<string>
      className="mosaic-aac"
      value={layoutTree}
      onChange={setLayoutTree}
      renderTile={renderTile}
      resize={editMode ? { minimumPaneSizePercentage: 12 } : 'DISABLED'}
      zeroStateView={
        <div className="mosaic-zero">No windows open. Hold “Edit”, then add one.</div>
      }
    />
  );
}
