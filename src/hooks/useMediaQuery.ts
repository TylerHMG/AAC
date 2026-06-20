import { useEffect, useState } from 'react';

// True when the viewport is at or below `breakpoint` px. Uses innerWidth + a
// resize listener (more reliable across environments than matchMedia).
// A width of 0 means "not measured yet" (can happen transiently) — treat that as
// NOT narrow so we default to the tiling layout rather than flashing the stack.
function isNarrowNow(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  return w > 0 && w <= breakpoint;
}

export function useIsNarrow(breakpoint = 640): boolean {
  const [narrow, setNarrow] = useState(() => isNarrowNow(breakpoint));

  useEffect(() => {
    const onResize = () => setNarrow(isNarrowNow(breakpoint));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return narrow;
}
