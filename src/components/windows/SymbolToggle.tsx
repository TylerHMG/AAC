// Shared [Text | Symbols] control for tile windows. Lets a window show each tile
// as text only (fast, for readers) or with its symbol (for emerging readers).
// `compact` renders the small variant that lives in the window title bar.
export function SymbolToggle({
  showSymbols,
  onChange,
  compact,
}: {
  showSymbols: boolean;
  onChange: (showSymbols: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`segmented${compact ? ' segmented--xs' : ''}`}
      role="group"
      aria-label="Tile display"
    >
      <button
        type="button"
        className={`segmented__btn${!showSymbols ? ' segmented__btn--active' : ''}`}
        aria-pressed={!showSymbols}
        onClick={() => onChange(false)}
      >
        Text
      </button>
      <button
        type="button"
        className={`segmented__btn${showSymbols ? ' segmented__btn--active' : ''}`}
        aria-pressed={showSymbols}
        onClick={() => onChange(true)}
      >
        Symbols
      </button>
    </div>
  );
}
