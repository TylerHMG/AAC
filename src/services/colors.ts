import type { WordCategory } from '../types/module';

// Tile colour engine (see STYLE_GUIDE.md → "Word-type (Fitzgerald) tile palette").
//
// The user customises ONE hue per word-type (the Fitzgerald colour). From that
// single hue we derive the guide's three coordinated values:
//   fill   — a light tint (the tile background; no coloured border)
//   symbol — a same-hue mid-dark for the icon
//   label  — a darker same-hue for the text, guaranteed ≥ 4.5:1 on the fill
// Light mode tints toward white; dark mode tints toward the dark surface and the
// symbol/label are lightened instead. Everything is contrast-checked so colour
// never becomes the only signal and text stays readable.

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Linear blend of two colours; t = weight of `b` (0 → a, 1 → b).
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
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

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function readableText(hex: string): string {
  return luminance(hex) > 0.5 ? '#1f1e1c' : '#ffffff';
}

// Push `colour` toward `toward` (white or black) until it reads at `target`
// contrast against `against`, so labels/symbols stay legible on any fill.
function ensureContrast(colour: string, against: string, target: number, toward: string): string {
  let out = colour;
  for (let i = 0; i < 14 && contrast(out, against) < target; i += 1) {
    out = mix(out, toward, 0.12);
  }
  return out;
}

interface Triple {
  fill: string;
  symbol: string;
  label: string;
}

function deriveTriple(base: string, dark: boolean): Triple {
  if (dark) {
    // Deep SAME-HUE tint (darken preserves the channel ratios, so the hue stays
    // distinct instead of muddying toward brown); lighten symbol/label for it.
    const fill = darken(base, 0.62);
    return {
      fill,
      symbol: ensureContrast(mix(base, '#ffffff', 0.25), fill, 3.5, '#ffffff'),
      label: ensureContrast(mix(base, '#ffffff', 0.45), fill, 4.5, '#ffffff'),
    };
  }
  // Light tint fill; darken symbol/label for contrast on it.
  const fill = mix(base, '#ffffff', 0.8);
  return {
    fill,
    symbol: ensureContrast(darken(base, 0.35), fill, 3.5, '#000000'),
    label: ensureContrast(darken(base, 0.5), fill, 4.5, '#000000'),
  };
}

// Publish each category's derived fill/symbol/label as CSS custom properties on
// :root so every tile updates instantly when a colour or the colour scheme
// changes. Pass `dark` to switch the derivation for prefers-color-scheme: dark.
export function applyCategoryColors(
  colors: Record<WordCategory, string>,
  dark = false,
): void {
  const root = document.documentElement;
  (Object.keys(colors) as WordCategory[]).forEach((cat) => {
    const { fill, symbol, label } = deriveTriple(colors[cat], dark);
    root.style.setProperty(`--cat-${cat}-fill`, fill);
    root.style.setProperty(`--cat-${cat}-symbol`, symbol);
    root.style.setProperty(`--cat-${cat}-label`, label);
  });
}
