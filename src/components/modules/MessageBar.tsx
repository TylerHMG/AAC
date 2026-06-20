import { useMessageBar } from '../../state/MessageBarContext';

// The message-bar module (spec Tier 0): accumulate, speak, backspace, clear.
// Anchored — it is the hub the other modules write into.
export function MessageBar() {
  const { items, backspace, clear, speakAll } = useMessageBar();

  return (
    <div className="message-bar">
      <button
        type="button"
        className="message-bar__phrase"
        onClick={speakAll}
        aria-label="Speak the whole message"
      >
        {items.length === 0 ? (
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
          className="ctrl ctrl--speak"
          onClick={speakAll}
          disabled={items.length === 0}
          aria-label="Speak"
        >
          🔊 Speak
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={backspace}
          disabled={items.length === 0}
          aria-label="Backspace"
        >
          ⌫
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={clear}
          disabled={items.length === 0}
          aria-label="Clear"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
