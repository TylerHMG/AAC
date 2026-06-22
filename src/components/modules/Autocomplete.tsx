import { useEffect, useMemo, useState } from 'react';
import type { Tile } from '../../types/module';
import { useMessageBar } from '../../state/MessageBarContext';
import {
  useBoard,
  DEFAULT_PREDICT_COUNT,
  PREDICT_COUNT_MIN,
  PREDICT_COUNT_MAX,
} from '../../state/BoardStore';
import { predict, subscribe, tokenize } from '../../services/prediction';
import { TileButton } from '../Tile';
import { AutoTileGrid } from '../AutoTileGrid';
import { showsSymbols } from '../../data/windowLibrary';

// Word-prediction window — a buffer-READER (spec §2.2). It watches the message
// bar, predicts the likely next words, and writes a tapped word back to the bar.
// The engine (services/prediction.ts) blends curated grammar, word frequency,
// and an on-device LEARNED model that personalises with use.
//
// Each window stores its own settings in its window config: how many words to
// show, and whether predictions carry a symbol (text-only is faster/cleaner;
// symbols help emerging readers — default off here). Both controls live in a top
// bar shown ONLY in arrange/edit mode, so the grid stays clean while communicating.

// Re-render when the learned model changes (async load + each learned utterance).
function usePredictionVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((n) => n + 1)), []);
  return version;
}

export function Autocomplete({ windowId }: { windowId: string }) {
  const { items, append } = useMessageBar();
  const { windows, updateWindowConfig, editMode } = useBoard();
  const version = usePredictionVersion();

  const win = windows[windowId];
  const count = win?.config?.predictCount ?? DEFAULT_PREDICT_COUNT;
  const showSymbols = win ? showsSymbols(win) : false; // prediction defaults to text

  function setCount(n: number) {
    updateWindowConfig(windowId, {
      predictCount: Math.min(PREDICT_COUNT_MAX, Math.max(PREDICT_COUNT_MIN, n)),
    });
  }

  const context = useMemo(() => tokenize(items.map((i) => i.label).join(' ')), [items]);

  const suggestions = useMemo(
    () => predict(context, count),
    // version forces a re-predict after the learned model loads or updates.
    [context, count, version],
  );

  return (
    <div className="win-stack">
      {/* Word-count only while arranging — keeps the grid clean in use mode.
          (The Text/Symbols toggle lives in the window title bar.) */}
      {editMode && (
        <div className="win-tools">
          <div className="ai-count" title="How many words this window shows">
            <button
              type="button"
              className="ai-count__btn"
              onClick={() => setCount(count - 1)}
              disabled={count <= PREDICT_COUNT_MIN}
              aria-label="Fewer words"
            >
              −
            </button>
            <span className="ai-count__val" aria-label={`${count} words`}>
              {count}
            </span>
            <button
              type="button"
              className="ai-count__btn"
              onClick={() => setCount(count + 1)}
              disabled={count >= PREDICT_COUNT_MAX}
              aria-label="More words"
            >
              ＋
            </button>
          </div>
        </div>
      )}

      <AutoTileGrid count={Math.max(suggestions.length, 1)}>
        {suggestions.map((s) => {
          const tile: Tile = {
            id: `predict.${s.word}`,
            label: s.word,
            spokenText: s.word,
            symbolKeyword: s.word,
            category: s.category,
          };
          return <TileButton key={s.word} tile={tile} onSelect={append} textOnly={!showSymbols} />;
        })}
      </AutoTileGrid>
    </div>
  );
}
