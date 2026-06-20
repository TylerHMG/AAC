import { useBoard } from '../state/BoardStore';
import { WINDOW_LIBRARY } from '../data/windowLibrary';
import { TEMPLATES } from '../data/templates';
import { Modal } from './Modal';

// Library/palette (arrange mode): open a new window, or replace the whole layout
// with a starter template.
export function WindowPalette({ onClose }: { onClose: () => void }) {
  const { openWindow, applyTemplate } = useBoard();

  return (
    <Modal title="Add window" onClose={onClose}>
      <div className="palette">
        <h3 className="palette__heading">Windows</h3>
        <div className="palette__grid">
          {WINDOW_LIBRARY.map((w) => (
            <button
              key={w.type}
              type="button"
              className="palette__item"
              onClick={() => {
                openWindow(w.type);
                onClose();
              }}
            >
              ＋ {w.title}
            </button>
          ))}
        </div>

        <h3 className="palette__heading">Start from a template</h3>
        <p className="settings__intro">Replaces the current layout.</p>
        <div className="palette__grid">
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
      </div>
    </Modal>
  );
}
