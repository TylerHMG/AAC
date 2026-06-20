import { useEffect, useState } from 'react';
import { activeSymbolProvider } from '../services/symbols';
import type { SymbolRef } from '../services/symbols';

// Renders whatever the active symbol provider returns. Handles emoji (sync) and
// image symbols (async — ARASAAC) uniformly, so the provider can be swapped with
// no change here. A specific `symbolId` (chosen in the tile editor) wins over the
// keyword.
export function SymbolView({ keyword, symbolId }: { keyword: string; symbolId?: number }) {
  const [ref, setRef] = useState<SymbolRef | null>(null);

  useEffect(() => {
    let active = true;
    const result =
      symbolId != null && activeSymbolProvider.resolveById
        ? activeSymbolProvider.resolveById(symbolId, keyword)
        : activeSymbolProvider.resolve(keyword);
    Promise.resolve(result).then((resolved) => {
      if (active) setRef(resolved);
    });
    return () => {
      active = false;
    };
  }, [keyword, symbolId]);

  if (!ref) return <span className="tile__symbol tile__symbol--loading" aria-hidden />;
  if (ref.kind === 'emoji') {
    return (
      <span className="tile__symbol" aria-hidden>
        {ref.value}
      </span>
    );
  }
  return <img className="tile__symbol tile__symbol--img" src={ref.url} alt={ref.alt} loading="lazy" />;
}
