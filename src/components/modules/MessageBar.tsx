import { useMessageBar } from '../../state/MessageBarContext';

// The message-bar module (spec Tier 0): accumulate, speak, backspace, clear.
// Anchored — it is the hub the other modules write into. Speak sits on the left;
// the phrase fills the middle; Clear and Delete sit on the right (Delete last).
export function MessageBar() {
  const { items, backspace, clear, speakAll } = useMessageBar();
  const empty = items.length === 0;

  return (
    <div className="message-bar">
      <button
        type="button"
        className="ctrl ctrl--speak message-bar__speak"
        onClick={speakAll}
        disabled={empty}
        aria-label="Speak"
      >
        🔊 Speak
      </button>

      <button
        type="button"
        className="message-bar__phrase"
        onClick={speakAll}
        aria-label="Speak the whole message"
      >
        {empty ? (
          <span className="message-bar__placeholder">Tap words to build a message…</span>
        ) : (
          items.map((item) => (
            <span key={item.key} className="message-bar__word">
              {item.label}
            </span>
          ))
        )}
      </button>

      <div className="message-bar__controls">
        <button
          type="button"
          className="ctrl"
          onClick={clear}
          disabled={empty}
          aria-label="Clear"
        >
          Clear
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={backspace}
          disabled={empty}
          aria-label="Delete"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
