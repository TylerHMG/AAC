import { useState } from 'react';
import { useMessageBar } from '../../state/MessageBarContext';
import { tts } from '../../services/tts';

// Keyboard module (spec Tier 1): text entry that writes to the shared buffer.
// Implemented as a pop-out (spec: "Pop-out or inline text entry"). Composes a
// draft, then speaks it and/or adds it to the message bar.
//
// A real <input> backs the draft so a physical keyboard works too; the on-screen
// keys are for touch devices.

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export function Keyboard({ onClose }: { onClose: () => void }) {
  const { appendText } = useMessageBar();
  const [draft, setDraft] = useState('');

  const press = (ch: string) => setDraft((d) => d + ch);
  const backspace = () => setDraft((d) => d.slice(0, -1));
  const clear = () => setDraft('');
  const speak = () => tts.speak(draft);

  const addToMessage = () => {
    if (draft.trim() === '') return;
    appendText(draft); // speaks + adds a chip to the message bar
    setDraft('');
  };

  return (
    <div className="keyboard">
      <input
        className="keyboard__display"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a word or sentence…"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        aria-label="Typed text"
      />

      <div className="keyboard__keys">
        {ROWS.map((row) => (
          <div className="keyboard__row" key={row}>
            {row.split('').map((ch) => (
              <button type="button" className="key" key={ch} onClick={() => press(ch)}>
                {ch}
              </button>
            ))}
          </div>
        ))}
        <div className="keyboard__row">
          <button type="button" className="key key--wide" onClick={backspace} aria-label="Backspace">
            ⌫
          </button>
          <button type="button" className="key key--space" onClick={() => press(' ')} aria-label="Space">
            space
          </button>
          <button type="button" className="key key--wide" onClick={clear}>
            clear
          </button>
        </div>
      </div>

      <div className="keyboard__actions">
        <button type="button" className="ctrl" onClick={speak} disabled={draft.trim() === ''}>
          🔊 Speak
        </button>
        <span className="editor__spacer" />
        <button type="button" className="ctrl" onClick={onClose}>
          Done
        </button>
        <button type="button" className="ctrl ctrl--speak" onClick={addToMessage} disabled={draft.trim() === ''}>
          Add to message
        </button>
      </div>
    </div>
  );
}
