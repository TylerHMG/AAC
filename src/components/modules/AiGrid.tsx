import { useState } from 'react';
import type { Tile } from '../../types/module';
import {
  generateTiles,
  AiConfigError,
  AiAccessError,
  hasAccessCode,
  setAccessCode,
} from '../../services/ai';
import { useMessageBar } from '../../state/MessageBarContext';
import { useBoard, AI_COUNT_MIN, AI_COUNT_MAX, DEFAULT_AI_COUNT } from '../../state/BoardStore';
import { TileButton } from '../Tile';
import { AutoTileGrid } from '../AutoTileGrid';
import { showsSymbols } from '../../data/windowLibrary';

const CONSENT_KEY = 'aac.aiConsent.v1';

// Plain-language opt-in (spec §6.3).
const CONSENT_NOTICE =
  'This feature sends the scenario description you type to an AI service to ' +
  'generate word suggestions. No personal information is sent. The rest of the ' +
  'app works fully without this feature.';

// The AI-grid window (spec Tier 0, headline feature). A DYNAMIC module: its
// window stays put in the layout while its tiles regenerate in place. Each AI
// window has its own generate count (stored in its window config), edited via
// the inline −/+ control; tiles auto-size to fit the window.
export function AiGrid({ windowId }: { windowId: string }) {
  const { append } = useMessageBar();
  const { windows, updateWindowConfig, editMode, addWindowTile } = useBoard();

  // "Save to my words" targets the first grid window on the board (there is no
  // single shared vocabulary anymore). Disabled when no grid window exists.
  const targetGridId = Object.values(windows).find((w) => w.type === 'grid')?.id ?? null;

  const [consented, setConsented] = useState<boolean>(
    () => localStorage.getItem(CONSENT_KEY) === 'true',
  );
  const [scenario, setScenario] = useState('');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [needsCode, setNeedsCode] = useState<boolean>(() => !hasAccessCode());
  const [codeInput, setCodeInput] = useState('');

  const win = windows[windowId];
  const count = win?.config?.aiCount ?? DEFAULT_AI_COUNT;
  const showSymbols = win ? showsSymbols(win) : true; // AI defaults to symbols

  function setCount(n: number) {
    updateWindowConfig(windowId, { aiCount: Math.min(AI_COUNT_MAX, Math.max(AI_COUNT_MIN, n)) });
  }

  function enableAi() {
    localStorage.setItem(CONSENT_KEY, 'true');
    setConsented(true);
  }

  async function handleGenerate() {
    if (scenario.trim() === '' || loading) return;
    setLoading(true);
    setError(null);
    setSaved(new Set());
    try {
      const result = await generateTiles(scenario, count);
      setTiles(result);
      if (result.length === 0) {
        setError('No suggestions came back. Try describing the situation differently.');
      }
    } catch (err) {
      // A rejected passphrase was already cleared in the service — re-prompt.
      if (err instanceof AiAccessError) setNeedsCode(true);
      const message =
        err instanceof AiConfigError || err instanceof Error
          ? err.message
          : 'Something went wrong generating words.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function saveTile(tile: Tile) {
    if (!targetGridId) return;
    addWindowTile(targetGridId, {
      label: tile.label,
      spokenText: tile.spokenText,
      symbolKeyword: tile.symbolKeyword,
      symbolId: tile.symbolId,
      category: tile.category,
    });
    setSaved((prev) => new Set(prev).add(tile.id));
  }

  // Opt-in gate — no API call can happen until the caregiver explicitly enables.
  if (!consented) {
    return (
      <div className="ai-grid ai-grid--notice">
        <h3>AI word suggestions</h3>
        <p>{CONSENT_NOTICE}</p>
        <button type="button" className="ctrl ctrl--speak" onClick={enableAi}>
          Enable AI suggestions
        </button>
      </div>
    );
  }

  // Passphrase gate — select users were given an access code. It is stored
  // locally and sent as a header; it is never part of the app bundle.
  if (needsCode) {
    return (
      <div className="ai-grid ai-grid--notice">
        <h3>Enter access passphrase</h3>
        <p>AI suggestions need the passphrase you were given.</p>
        <form
          className="ai-grid__prompt"
          onSubmit={(e) => {
            e.preventDefault();
            if (codeInput.trim() === '') return;
            setAccessCode(codeInput);
            setCodeInput('');
            setError(null);
            setNeedsCode(false);
          }}
        >
          <input
            type="password"
            className="ai-grid__input"
            placeholder="Passphrase"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            autoComplete="off"
            aria-label="Access passphrase"
          />
          <button type="submit" className="ctrl ctrl--speak" disabled={codeInput.trim() === ''}>
            Continue
          </button>
        </form>
        {error && <p className="ai-grid__error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ai-grid">
      <form
        className="ai-grid__prompt"
        onSubmit={(e) => {
          e.preventDefault();
          void handleGenerate();
        }}
      >
        <input
          type="text"
          className="ai-grid__input"
          placeholder="Describe the situation, then press Enter — e.g. “at the park feeding ducks”"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          disabled={loading}
          aria-label="Describe the situation, then press Enter to generate"
        />
        {/* This window's own word count — click −/+ to change how many it makes. */}
        <div className="ai-count" title="How many words this box generates">
          <button
            type="button"
            className="ai-count__btn"
            onClick={() => setCount(count - 1)}
            disabled={count <= AI_COUNT_MIN}
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
            disabled={count >= AI_COUNT_MAX}
            aria-label="More words"
          >
            ＋
          </button>
        </div>
        {/* No Generate button — a single-field form submits on Enter. */}
      </form>

      {loading && <p className="ai-grid__hint">Generating…</p>}

      {error && <p className="ai-grid__error">{error}</p>}

      {tiles.length > 0 ? (
        <AutoTileGrid count={tiles.length}>
          {tiles.map((tile) => (
            <div className="ai-tile" key={tile.id}>
              <TileButton tile={tile} onSelect={append} textOnly={!showSymbols} />
              {editMode && (
                <button
                  type="button"
                  className="ai-tile__save"
                  onClick={() => saveTile(tile)}
                  disabled={saved.has(tile.id) || !targetGridId}
                  title={targetGridId ? undefined : 'Add a grid window to save words'}
                  aria-label={`Save ${tile.label} to a grid`}
                >
                  {saved.has(tile.id) ? '✓ Saved' : '＋ Save'}
                </button>
              )}
            </div>
          ))}
        </AutoTileGrid>
      ) : (
        !loading &&
        !error && (
          <p className="ai-grid__hint">
            Type a situation above and press Enter. Suggested words for that moment appear here.
          </p>
        )
      )}
    </div>
  );
}
