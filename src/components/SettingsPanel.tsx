import { useState } from 'react';
import {
  useBoard,
  SPEECHBAR_MIN,
  SPEECHBAR_MAX,
  SPEECHBAR_STEP,
  BOTTOMBTN_MIN,
  BOTTOMBTN_MAX,
  BOTTOMBTN_STEP,
} from '../state/BoardStore';
import { CATEGORY_META } from '../data/categories';
import { Modal } from './Modal';

type Tab = 'layout' | 'colours';

function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="ctrl"
        onClick={() => onChange(value - step)}
        disabled={value <= min}
        aria-label={`Less ${label}`}
      >
        −
      </button>
      <span className="stepper__value">{value}</span>
      <button
        type="button"
        className="ctrl"
        onClick={() => onChange(value + step)}
        disabled={value >= max}
        aria-label={`More ${label}`}
      >
        +
      </button>
    </div>
  );
}

// Board settings. Window widths are set by dragging window edges in arrange
// mode; tile sizes are automatic. So the only inputs here are AI tile count,
// bar/button heights, and the word-type colours.
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    speechBarSize,
    setSpeechBarSize,
    bottomButtonSize,
    setBottomButtonSize,
    categoryColors,
    setCategoryColor,
    resetAll,
  } = useBoard();

  const [tab, setTab] = useState<Tab>('layout');

  function handleReset() {
    if (
      window.confirm('Reset the layout, tiles, sizes, and colours to defaults? This removes custom tiles.')
    ) {
      resetAll();
      onClose();
    }
  }

  return (
    <Modal title="Board settings" onClose={onClose}>
      <div className="settings">
        <div className="settings__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layout'}
            className={`settings__tab${tab === 'layout' ? ' settings__tab--active' : ''}`}
            onClick={() => setTab('layout')}
          >
            Layout &amp; size
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'colours'}
            className={`settings__tab${tab === 'colours' ? ' settings__tab--active' : ''}`}
            onClick={() => setTab('colours')}
          >
            Colours
          </button>
        </div>

        {tab === 'layout' && (
          <div className="settings__panel">
            <p className="settings__intro">
              Add windows with “＋ Window”. Drag a window’s title bar to rearrange, and drag the
              edges between windows to resize. Tiles size themselves to fill each window. Each AI
              window sets its own word count with the −/+ control on the window.
            </p>

            <div className="settings__row">
              <span className="settings__label">
                Speech bar size
                <small className="settings__hint"> Speak / delete / clear at the top</small>
              </span>
              <Stepper
                value={speechBarSize}
                onChange={setSpeechBarSize}
                min={SPEECHBAR_MIN}
                max={SPEECHBAR_MAX}
                step={SPEECHBAR_STEP}
                label="speech bar size"
              />
            </div>

            <div className="settings__row">
              <span className="settings__label">
                Bottom buttons size
                <small className="settings__hint"> Edit / Keyboard at the bottom</small>
              </span>
              <Stepper
                value={bottomButtonSize}
                onChange={setBottomButtonSize}
                min={BOTTOMBTN_MIN}
                max={BOTTOMBTN_MAX}
                step={BOTTOMBTN_STEP}
                label="bottom buttons size"
              />
            </div>
          </div>
        )}

        {tab === 'colours' && (
          <div className="settings__panel">
            <p className="settings__intro">Each word type has its own colour. Tap a swatch to change it.</p>
            {CATEGORY_META.map((c) => (
              <div className="settings__row" key={c.value}>
                <span className="settings__label">
                  {c.label}
                  <small className="settings__hint"> {c.hint}</small>
                </span>
                <input
                  type="color"
                  className="color-input"
                  value={categoryColors[c.value]}
                  onChange={(e) => setCategoryColor(c.value, e.target.value)}
                  aria-label={`${c.label} colour`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="settings__footer">
          <button type="button" className="ctrl ctrl--danger" onClick={handleReset}>
            Reset to defaults
          </button>
        </div>
      </div>
    </Modal>
  );
}
