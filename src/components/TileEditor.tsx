import { useState } from 'react';
import type { Tile, TileDraft, WordCategory } from '../types/module';
import { searchSymbols } from '../services/symbols';
import type { SymbolSearchResult } from '../services/symbols';
import { CATEGORY_META } from '../data/categories';
import { SymbolView } from './SymbolView';
import { Modal } from './Modal';

interface TileEditorProps {
  // null = create a new tile; otherwise edit this one.
  tile: Tile | null;
  onSave: (draft: TileDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

// Create or edit a custom speech tile (spec Tier 0 manual editing): label,
// spoken text, category colour, and a symbol chosen from ARASAAC.
export function TileEditor({ tile, onSave, onDelete, onClose }: TileEditorProps) {
  const [label, setLabel] = useState(tile?.label ?? '');
  const [spokenText, setSpokenText] = useState(tile?.spokenText ?? '');
  const [category, setCategory] = useState<WordCategory>(tile?.category ?? 'noun');
  const [symbolKeyword, setSymbolKeyword] = useState(tile?.symbolKeyword ?? '');
  const [symbolId, setSymbolId] = useState<number | undefined>(tile?.symbolId);

  const [query, setQuery] = useState(tile?.symbolKeyword ?? '');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function runSearch() {
    const term = query.trim();
    if (term === '') return;
    setSearching(true);
    try {
      setResults(await searchSymbols(term));
    } finally {
      setSearching(false);
    }
  }

  function chooseSymbol(result: SymbolSearchResult) {
    setSymbolId(result.id);
    if (symbolKeyword.trim() === '') setSymbolKeyword(result.keyword);
  }

  function handleSave() {
    const finalLabel = label.trim();
    if (finalLabel === '') return;
    onSave({
      label: finalLabel,
      spokenText: spokenText.trim() === '' ? finalLabel : spokenText.trim(),
      category,
      symbolKeyword: symbolKeyword.trim() === '' ? finalLabel : symbolKeyword.trim(),
      symbolId,
    });
  }

  return (
    <Modal title={tile ? 'Edit tile' : 'New tile'} onClose={onClose} wide>
      <div className="editor">
        <div className="editor__preview">
          <div className={`tile tile--${category} tile--preview`}>
            <SymbolView keyword={symbolKeyword || label || ' '} symbolId={symbolId} />
            <span className="tile__label">{label || 'Label'}</span>
          </div>
          <span className="editor__preview-hint">Preview</span>
        </div>

        <div className="editor__fields">
          <label className="field">
            <span className="field__label">Label (shown on the tile)</span>
            <input
              className="field__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. juice"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Spoken text (what is said aloud)</span>
            <input
              className="field__input"
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder="Defaults to the label"
            />
          </label>

          <label className="field">
            <span className="field__label">Colour category</span>
            <select
              className="field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value as WordCategory)}
            >
              {CATEGORY_META.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span className="field__label">Symbol (ARASAAC)</span>
            <div className="editor__search">
              <input
                className="field__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder="Search pictograms, e.g. juice"
              />
              <button type="button" className="ctrl" onClick={() => void runSearch()} disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </div>
            <div className="editor__results">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`editor__result${symbolId === r.id ? ' editor__result--selected' : ''}`}
                  onClick={() => chooseSymbol(r)}
                  aria-label={`Use pictogram ${r.id}`}
                >
                  <img src={r.url} alt="" loading="lazy" />
                </button>
              ))}
              {!searching && results.length === 0 && (
                <span className="editor__results-hint">
                  Search to pick a pictogram, or leave blank to auto-match the label.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="editor__actions">
        {onDelete && (
          <button type="button" className="ctrl ctrl--danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <span className="editor__spacer" />
        <button type="button" className="ctrl" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="ctrl ctrl--speak" onClick={handleSave} disabled={label.trim() === ''}>
          Save
        </button>
      </div>
    </Modal>
  );
}
