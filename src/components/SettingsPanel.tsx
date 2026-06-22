import { useEffect, useState } from 'react';
import {
  useBoard,
  SPEECHBAR_MIN,
  SPEECHBAR_MAX,
  SPEECHBAR_STEP,
  BOTTOMBTN_MIN,
  BOTTOMBTN_MAX,
  BOTTOMBTN_STEP,
  RATE_MIN,
  RATE_MAX,
  PITCH_MIN,
  PITCH_MAX,
} from '../state/BoardStore';
import { CATEGORY_META } from '../data/categories';
import { tts } from '../services/tts';
import { Modal } from './Modal';

type Tab = 'layout' | 'colours' | 'speech';

// System TTS voices load asynchronously; re-render when they arrive.
function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => tts.getVoices());
  useEffect(() => {
    const update = () => setVoices(tts.getVoices());
    update();
    return tts.onVoices(update);
  }, []);
  return voices;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="settings__row">
      <span className="settings__label">{label}</span>
      <div className="slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
        <span className="slider__value">{display}</span>
      </div>
    </div>
  );
}

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
    theme,
    setTheme,
    speech,
    updateSpeech,
    resetAll,
  } = useBoard();

  const [tab, setTab] = useState<Tab>('layout');
  const voices = useVoices();

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
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'speech'}
            className={`settings__tab${tab === 'speech' ? ' settings__tab--active' : ''}`}
            onClick={() => setTab('speech')}
          >
            Speech
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
            <div className="settings__row">
              <span className="settings__label">
                Appearance
                <small className="settings__hint"> Light or dark theme</small>
              </span>
              <div className="segmented" role="group" aria-label="Appearance theme">
                <button
                  type="button"
                  className={`segmented__btn${theme === 'light' ? ' segmented__btn--active' : ''}`}
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`segmented__btn${theme === 'dark' ? ' segmented__btn--active' : ''}`}
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
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

        {tab === 'speech' && (
          <div className="settings__panel">
            {!tts.available ? (
              <p className="settings__intro">This device doesn’t support speech synthesis.</p>
            ) : (
              <>
                <p className="settings__intro">Choose the voice and how it speaks. Changes apply right away.</p>

                <div className="settings__row">
                  <span className="settings__label">
                    Voice
                    <small className="settings__hint"> System voices (varies by device)</small>
                  </span>
                  <select
                    className="field__input"
                    value={speech.voiceURI ?? ''}
                    onChange={(e) => updateSpeech({ voiceURI: e.target.value || null })}
                    aria-label="Voice"
                  >
                    <option value="">Device default</option>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <p className="settings__note">
                  Voices come from your device. For more natural speech, add an “Enhanced” voice in
                  your device’s accessibility settings and it’ll appear here (on iPad: Settings →
                  Accessibility → Spoken Content → Voices).
                </p>

                <Slider
                  label="Speed"
                  value={speech.rate}
                  min={RATE_MIN}
                  max={RATE_MAX}
                  step={0.1}
                  display={`${speech.rate.toFixed(1)}×`}
                  onChange={(rate) => updateSpeech({ rate })}
                />
                <Slider
                  label="Pitch"
                  value={speech.pitch}
                  min={PITCH_MIN}
                  max={PITCH_MAX}
                  step={0.1}
                  display={speech.pitch.toFixed(1)}
                  onChange={(pitch) => updateSpeech({ pitch })}
                />
                <Slider
                  label="Volume"
                  value={speech.volume}
                  min={0}
                  max={1}
                  step={0.05}
                  display={`${Math.round(speech.volume * 100)}%`}
                  onChange={(volume) => updateSpeech({ volume })}
                />

                <div className="settings__row">
                  <span className="settings__label">Test</span>
                  <button
                    type="button"
                    className="ctrl ctrl--speak"
                    onClick={() => tts.speak('This is how I sound.')}
                  >
                    🔊 Test voice
                  </button>
                </div>
              </>
            )}
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
