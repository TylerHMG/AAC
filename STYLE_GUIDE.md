# Modular AAC — UI Style Guide

A design system to clean up the interface. The current UI reads "cheap" for five fixable reasons: muddy mid-tone tile colours, heavy dark borders on everything, inconsistent button styles, no real elevation, and default fonts/weights. This guide fixes all five. **Implement these as design tokens (CSS custom properties) in one place and apply them everywhere — do not hardcode colours, borders, or radii in components.**

## Design principles

1. **Calm, not busy.** AAC users scan a lot of cells. Reduce visual noise: light fills, hairline borders, generous space.
2. **Colour means something.** Tile colour encodes word type (Fitzgerald Key). Never use colour decoratively — and never let it be the *only* signal; the symbol and label always carry the meaning.
3. **One accent.** A single confident accent colour for primary actions. Everything else is neutral. Muted/desaturated "primary" buttons look disabled — avoid them.
4. **Consistency over cleverness.** One radius scale, one spacing scale, one button system, used uniformly. Most of the "cheap" feeling comes from small inconsistencies.
5. **Accessibility is the baseline**, not a polish layer: 44px tap targets, 4.5:1 text contrast, visible focus, reduced-motion support.

---

## Design tokens

Drop these into a single stylesheet as `:root` variables and reference them everywhere. Both light and dark are defined.

```css
:root {
  /* Neutrals — light */
  --bg-app:        #F5F4F0;   /* app background */
  --bg-surface:    #FFFFFF;   /* windows, modal, message bar */
  --bg-subtle:     #F0EFEB;   /* insets, title bars, secondary fills */
  --border-hair:   rgba(0,0,0,0.08);  /* default separators */
  --border-strong: rgba(0,0,0,0.14);  /* secondary buttons, inputs */
  --text-1:        #1F1E1C;   /* primary text */
  --text-2:        #5C5A55;   /* secondary text */
  --text-3:        #8A8881;   /* tertiary / placeholder */

  /* Accent — primary actions (Speak, confirm) */
  --accent:        #0F6E56;
  --accent-hover:  #0B5A46;
  --accent-on:     #FFFFFF;
  --accent-ring:   rgba(15,110,86,0.35);  /* focus / selected */

  /* Elevation (light mode only — see dark note below) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06);

  /* Radius */
  --r-sm: 8px;    /* chips, inputs, steppers */
  --r-md: 14px;   /* tiles, rectangular buttons */
  --r-lg: 18px;   /* windows, modal */
  --r-pill: 999px;/* primary & secondary buttons */

  /* Spacing scale — use ONLY these */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px; --s-8: 32px;

  /* Type */
  --font: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-app:        #1A1A18;
    --bg-surface:    #242422;
    --bg-subtle:     #2E2D2A;
    --border-hair:   rgba(255,255,255,0.10);
    --border-strong: rgba(255,255,255,0.16);
    --text-1:        #F2F1ED;
    --text-2:        #B5B3AC;
    --text-3:        #84827B;
    --accent:        #2E9E80;
    --accent-hover:  #3BB394;
    --accent-on:     #08110E;
    /* In dark mode prefer hairline borders over shadows for elevation. */
    --shadow-sm: none;
    --shadow-md: none;
  }
}
```

### Word-type (Fitzgerald) tile palette

Each category has three values: **fill** (tile background), **symbol** (icon colour), **label** (text colour). These pairings are contrast-checked. Light mode is the default; dark-mode values keep the same hues as deeper tints.

| Category | Light fill / symbol / label | Dark fill / symbol / label |
|---|---|---|
| People / pronouns (blue) | `#E6F1FB` / `#185FA5` / `#0C447C` | `#16314A` / `#7FBBF2` / `#BBD9F7` |
| Actions / verbs (green) | `#EAF3DE` / `#5C8F1F` / `#27500A` | `#25340F` / `#9FCB5E` / `#CDE3A6` |
| Social / feelings (pink) | `#FBEAF0` / `#C13E69` / `#72243E` | `#3A1623` / `#E58AAC` / `#F3C2D3` |
| Objects / nouns (amber) | `#FAEEDA` / `#A9690F` / `#633806` | `#3A2606` / `#E0A53A` / `#F0D29A` |
| Questions (purple) | `#EEEDFE` / `#6258C9` / `#3C3489` | `#211E3F` / `#A39BEC` / `#CFCBF5` |

Rule: **fill + symbol + label come from the same row.** No category-coloured borders — the fill carries the colour. This single change removes most of the "cheap" look.

---

## Tiles

The biggest visual fix. Current tiles use saturated fills with dark text and a 2px coloured border. Replace with:

- **Background:** the category *fill* token. **No border** by default — the fill plus the gap between tiles separates them. (If two same-colour tiles sit adjacent and need separation, use a `--border-hair`, never a coloured border.)
- **Symbol:** centred, in the category *symbol* colour, sized ~44% of tile height.
- **Label:** below the symbol, category *label* colour, `15px / 500 weight`, sentence case, max two lines.
- **Radius:** `--r-md`. **Padding:** `--s-3`. **Gap between tiles:** `--s-2`.
- **Minimum size:** 64px; **never** let a tile's tappable area drop below **44×44px** even when windows are resized.

States:
- **Pressed:** `transform: scale(0.97)` + fill darkened ~5%; 120ms.
- **Selected / just added to message:** a 2px ring in `--accent-ring` (NOT a category colour, so "selected" is never confused with word type).
- **Disabled:** 40% opacity, no pointer.

---

## Buttons

One system, used everywhere. Inconsistent button styles are a major cause of the cheap feel. Every button in a given row shares the same height (**44px**) and radius (`--r-pill`).

- **Primary** (one per context — e.g. Speak, Done): fill `--accent`, text `--accent-on`, `500 weight`, padding `0 var(--s-5≈20px)`, optional leading icon. Hover → `--accent-hover`. Never desaturate it.
- **Secondary** (Clear, Settings, Add window): `--bg-surface` background, `1px solid --border-strong`, text `--text-2`. Same height/radius as primary.
- **Tertiary / text** (low-emphasis): no border, no fill, text `--text-2`.
- **Icon button** (backspace, close): 44×44, `--r-pill` or `--r-md`, `1px solid --border-strong`, icon in `--text-2`.

Do **not** mix filled and heavily-outlined buttons of different sizes in one row (the current Speak/Clear mismatch). Pick primary for the main action, secondary for the rest.

---

## Borders & elevation

- **Replace every heavy/dark border** (anything ≥1.5px or near-black) with `--border-hair`, or remove it and separate surfaces with fill contrast + spacing.
- **Use elevation, not thick borders, to show "this floats above."** Windows and the message bar get `--shadow-sm`; the modal gets `--shadow-md`. This is the change that most separates "cheap" from "polished" in product UI. In dark mode, shadows read poorly — use a `--border-hair` outline instead (already handled by the token override).
- Inputs and steppers: `1px solid --border-strong`, `--r-sm`, `--bg-surface`.

---

## Typography

- **Font:** Inter (bundle it for offline use) with a system fallback. Default system fonts are a common "cheap" tell; one clean typeface fixes it cheaply.
- **Weights:** 400 for body, 500 for labels/buttons/emphasis, 600 only for screen/modal titles. Never use more than these three.
- **Scale:** screen/modal title 18–20px / 600 · section label 13px / 500 · body 14px / 400 · tile label 15px / 500 · caption & attribution 11–12px / 400 (`--text-3`). Nothing below 11px.
- Sentence case everywhere (including buttons and titles).

---

## Component specifics

### Message bar (fixed top frame)
`--bg-surface`, `--r-lg`, `--shadow-sm`, comfortable height. Placeholder in `--text-3`; built-up words render as small chips. Speak = **primary**, backspace = **icon button**, Clear = **secondary** — all 44px tall and vertically aligned. No oversized boxy buttons.

### Window chrome (arrange mode only)
Title bar: `--bg-subtle`, 34px tall, containing a grip (`--text-3`), the window name (`13px / 500`, `--text-2`), and action icons (`--text-3`). Window body: `--bg-surface`. Hidden entirely in Use mode.

### Resize handles
6–8px wide, `--bg-subtle`, with a faint grip glyph in `--text-3`. Brighten to `--border-strong` on hover; cursor `col-resize` / `row-resize`.

### Modal (e.g. Board settings)
`--bg-surface`, `--r-lg`, `--shadow-md`, max-width ~480px, padding `--s-6`. Title `18px / 600` with a close icon button top-right. Tabs: text in `--text-2`, active tab gains a 2px `--accent` underline and `--text-1`. **Steppers:** make each a single connected segmented control `[ − | value | + ]` with a fixed-width value field so all rows align; label on the left in `--text-1`, control right-aligned. (The current loose −/number/+ trio reads clunky.)

---

## Motion

120–180ms ease-out for hover, press, open/close. No bounce, no long transitions. Always wrap in `@media (prefers-reduced-motion: reduce)` to disable.

---

## Accessibility (non-negotiable)

- Text-on-fill contrast ≥ **4.5:1** (the palette pairings above already pass).
- Tap targets ≥ **44×44px** everywhere, always.
- **Colour is never the only signal** — symbol + label carry meaning; colour reinforces.
- Visible **focus ring** (2px `--accent-ring`) on every interactive element, for keyboard and switch access.
- Honour `prefers-color-scheme`; ship a **high-contrast** option that swaps fills for white/borders and boosts text to `--text-1`.

---

## Do / don't

- **Do** use light category fills with same-hue symbol + label. **Don't** use saturated mid-tone fills with dark text.
- **Do** separate with hairlines + space + elevation. **Don't** outline everything in thick dark borders.
- **Do** keep one accent and one button system. **Don't** mix desaturated "primary" buttons with oversized outlined ones.
- **Do** pick one radius and spacing scale. **Don't** mix 6px and 14px corners across components.
- **Do** bundle one clean typeface at 2–3 weights. **Don't** rely on default system fonts at default weights.

---

### Suggested approach for Claude Code
1. Add the token block (`:root` + dark + the category palette as CSS vars or a JS map) in one shared place.
2. Refactor tiles first (fills, drop coloured borders, label weight) — biggest visual win.
3. Unify all buttons to the primary/secondary/icon system at 44px.
4. Swap heavy borders for hairlines + add `--shadow-sm/md` to windows, message bar, and modal.
5. Bundle Inter and apply the type scale.
6. Tidy the settings modal (aligned segmented steppers, tab styling).
