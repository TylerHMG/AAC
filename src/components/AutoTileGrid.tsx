import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useElementSize } from '../hooks/useElementSize';

const GAP = 8;
const MIN_CELL = 44; // tiles must never drop below a 44px tap target (spec)

interface Layout {
  cols: number;
  rows: number;
  cell: number; // px, the smaller cell dimension (drives symbol/label scaling)
  scroll: boolean; // true only when the window is too small to fit at 44px
}

// Pick the columns/rows that fit `count` cells into width×height with the
// largest possible (most square) cells, and that fill the area most evenly (the
// fewest empty trailing cells), so tiles spread across the whole box with no
// scrolling.
function bestLayout(width: number, height: number, count: number): Layout {
  if (count <= 0) return { cols: 1, rows: 1, cell: 0, scroll: false };
  if (width <= 0 || height <= 0) {
    // Not measured yet — a reasonable first-paint guess, corrected on resize.
    const cols = Math.ceil(Math.sqrt(count));
    return { cols, rows: Math.ceil(count / cols), cell: 64, scroll: false };
  }

  const candidates: { cols: number; rows: number; cell: number; waste: number }[] = [];
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cw = (width - (cols - 1) * GAP) / cols;
    const ch = (height - (rows - 1) * GAP) / rows;
    if (cw <= 0 || ch <= 0) continue;
    candidates.push({ cols, rows, cell: Math.min(cw, ch), waste: cols * rows - count });
  }
  if (candidates.length === 0) return { cols: 1, rows: count, cell: MIN_CELL, scroll: true };

  // Keep the biggest tiles, but among near-equally-big options prefer the one
  // that leaves the fewest empty cells (most even fill).
  const maxCell = Math.max(...candidates.map((c) => c.cell));
  const good = candidates.filter((c) => c.cell >= maxCell * 0.92);
  good.sort((a, b) => a.waste - b.waste || b.cell - a.cell);
  const best = good[0];

  // If even the best fit puts tiles below the 44px tap target, the window is too
  // small: keep cells at 44px, fit as many columns as the width allows, and let
  // the grid scroll vertically (last-resort fallback only).
  if (best.cell < MIN_CELL) {
    const cols = Math.max(1, Math.floor((width + GAP) / (MIN_CELL + GAP)));
    return { cols, rows: Math.ceil(count / cols), cell: MIN_CELL, scroll: true };
  }
  return { ...best, scroll: false };
}

// A grid that auto-sizes its cells to fit exactly `count` tiles in the available
// space (no scrolling). Children fill the cells left-to-right, top-to-bottom;
// sizing is based on `count` so tile size stays stable as tiles are added.
export function AutoTileGrid({ count, children }: { count: number; children: ReactNode }) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const { cols, rows, cell, scroll } = useMemo(
    () => bestLayout(width, height, Math.max(count, 1)),
    [width, height, count],
  );

  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    // Fixed row height when scrolling so cells stay at the 44px floor; otherwise
    // split the height evenly so tiles fill the box.
    gridTemplateRows: scroll ? `repeat(${rows}, ${cell}px)` : `repeat(${rows}, 1fr)`,
    gap: `${GAP}px`,
    overflowY: scroll ? 'auto' : 'hidden',
    alignContent: scroll ? 'start' : 'stretch',
    // Published for tiles to scale their symbol/label.
    ['--cell' as string]: `${cell}px`,
  };

  return (
    <div ref={ref} className="auto-grid" style={style}>
      {children}
    </div>
  );
}
