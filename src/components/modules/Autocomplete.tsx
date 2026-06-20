import { useMemo } from 'react';
import type { Tile } from '../../types/module';
import { useMessageBar } from '../../state/MessageBarContext';
import { TileButton } from '../Tile';
import { AutoTileGrid } from '../AutoTileGrid';

// A buffer-READER window (spec §2.2): it subscribes to the message bar and offers
// next-word suggestions based on the last word. Tapping a suggestion writes it
// back to the bar. This is a lightweight on-device predictor (no network, no
// server) — a small bigram map plus a common-words fallback — enough to prove
// the reader/writer loop; a richer model can replace `predict()` later.

const NEXT: Record<string, string[]> = {
  i: ['want', 'like', 'need', 'am', 'feel', 'have', 'can', 'see'],
  you: ['are', 'want', 'like', 'can', 'have', 'feel', 'need'],
  want: ['to', 'more', 'it', 'that', 'the', 'a'],
  like: ['it', 'that', 'to', 'this', 'more'],
  need: ['help', 'to', 'more', 'a', 'the'],
  to: ['go', 'eat', 'play', 'stop', 'see', 'have', 'drink'],
  more: ['please', 'of', 'that', 'now'],
  go: ['home', 'outside', 'now', 'there', 'to'],
  the: ['ball', 'book', 'one', 'toy', 'food'],
  a: ['lot', 'little', 'break', 'turn'],
  feel: ['happy', 'sad', 'sick', 'tired', 'good'],
  is: ['it', 'that', 'good', 'done'],
  it: ['is', 'now', 'please'],
  help: ['me', 'please'],
  me: ['please', 'now'],
};

const COMMON = ['I', 'you', 'want', 'more', 'help', 'like', 'go', 'stop', 'yes', 'no', 'please', 'it'];

function predict(lastWord: string | null): string[] {
  if (!lastWord) return COMMON;
  return NEXT[lastWord.toLowerCase()] ?? COMMON;
}

export function Autocomplete() {
  const { items, append } = useMessageBar();

  const lastWord = items.length > 0 ? items[items.length - 1].spokenText : null;

  // Suggestion "tiles" (reuse the tile component for consistent look + symbols).
  const tiles = useMemo<Tile[]>(
    () =>
      predict(lastWord).map((word, i) => ({
        id: `predict.${word}.${i}`,
        label: word,
        spokenText: word,
        symbolKeyword: word,
        category: 'social',
      })),
    [lastWord],
  );

  return (
    <AutoTileGrid count={Math.max(tiles.length, 1)}>
      {tiles.map((tile) => (
        <TileButton key={tile.id} tile={tile} onSelect={append} />
      ))}
    </AutoTileGrid>
  );
}
