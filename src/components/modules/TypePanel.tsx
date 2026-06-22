import { useState } from 'react';
import { useMessageBar } from '../../state/MessageBarContext';
import { tts } from '../../services/tts';

// Type panel (spec Tier 1 text entry). The device's own keyboard (e.g. iOS)
// pops up when the field is focused, so we don't ship a redundant on-screen
// QWERTY — just a text field plus Speak / Add to message / Done.
export function TypePanel({ onClose }: { onClose: () => void }) {
  const { appendText } = useMessageBar();
  const [draft, setDraft] = useState('');
  const empty = draft.trim() === '';

  const speak = () => tts.speak(draft);

  const addToMessage = () => {
    if (empty) return;
    appendText(draft); // speaks + adds a chip to the message bar
    setDraft('');
  };

  return (
    <div className="type-panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addToMessage(); // Enter on the native keyboard adds to the message
        }}
      >
        <input
          className="type-panel__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a word or sentence…"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          aria-label="Type text"
        />
      </form>

      <div className="type-panel__actions">
        <button type="button" className="ctrl" onClick={speak} disabled={empty}>
          🔊 Speak
        </button>
        <span className="editor__spacer" />
        <button type="button" className="ctrl" onClick={onClose}>
          Done
        </button>
        <button type="button" className="ctrl ctrl--speak" onClick={addToMessage} disabled={empty}>
          Add to message
        </button>
      </div>
    </div>
  );
}
