import type { WordCategory } from '../types/module';

// Colour helpers for user-customizable tile colours. From a single picked
// background colour we derive a readable border (darker) and label text colour
// (black or white by luminance), then publish them as CSS variables that the
// tile styles consume.

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function darken(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

// WCAG relative luminance (0 = black, 1 = white).
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableText(hex: string): string {
  return luminance(hex) > 0.5 ? '#1f2421' : '#ffffff';
}

// Publish the category colours as CSS custom properties on :root so every tile
// updates instantly when a colour changes.
export function applyCategoryColors(colors: Record<WordCategory, string>): void {
  const root = document.documentElement;
  (Object.keys(colors) as WordCategory[]).forEach((cat) => {
    const bg = colors[cat];
    root.style.setProperty(`--cat-${cat}`, bg);
    root.style.setProperty(`--cat-${cat}-edge`, darken(bg, 0.22));
    root.style.setProperty(`--cat-${cat}-text`, readableText(bg));
  });
}
