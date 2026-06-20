# Modular AAC

A free, web-based AAC (Augmentative and Alternative Communication) platform built
around a composable **module system** instead of fixed boards.

The full vision is in [`aac-capabilities-spec.md`](./aac-capabilities-spec.md).

## Iteration 2 additions

- **Customizable grids** — in edit mode, open **Settings** to set how many speech
  boxes sit across each section (Core columns, AI columns) and how many tiles the
  AI generates. Saved per device.
- **Custom speech options** — add/edit/delete your own tiles (label, spoken text,
  colour, and a symbol picked from ARASAAC). Custom tiles persist across reloads.
- **Real ARASAAC pictograms** — tiles now use ARASAAC's open symbol set via its
  public API, with emoji as an automatic fallback for unmatched words.
- **Keyboard** — a pop-out on-screen keyboard (also accepts a physical keyboard)
  that composes text, speaks it, and adds it to the message bar.

### Using edit mode

Editing is gated behind a **hold-to-edit** lock so the AAC user can't change the
board by accident (spec Tier 0 edit lock). Press and **hold** "✎ Hold to edit"
(~0.6s) to enter caregiver/edit mode. There you can:

- Tap any tile to edit it, or tap **＋ Add** to create one.
- Open **⚙ Settings** to change grid columns / AI tile count or reset to defaults.
- Tap **＋ Save** on an AI-generated tile to keep it in your core words.

Tap **✓ Done** to leave edit mode.

## What's in this draft

The goal of the core proof is to demonstrate the central thesis (spec §1): a board
assembled from interchangeable modules can be **flexible *and* stable at the same
time**, by distinguishing two behaviours:

- **Anchored modules** — fixed position, never move (muscle memory). Here: the
  **message bar** and the **core grid**.
- **Dynamic modules** — content swaps inside a region that itself stays put. Here:
  the **AI grid**.

Implemented:

- **Module-based board renderer** — a coarse 12×8 cell grid; modules occupy
  rectangular cell regions; reflows by resizing cells, not repositioning.
- **Module contract** — every module declares type, footprint, behaviour, scan
  order, and buffer relationship (`src/types/module.ts`).
- **Message bar** — accumulate, speak, backspace, clear (the shared hub).
- **Text-to-speech** — Web Speech API; speaks individual tiles and the assembled
  phrase.
- **Core grid** — fixed, always-visible core vocabulary.
- **AI grid** — type a scenario → Claude returns vocabulary tiles into the dynamic
  region. Includes the **opt-in consent gate**, **defensive JSON parsing**, and a
  basic **output safety filter**.

Deferred to the next pass (intentionally — see "Scope" below): manual tile
editing, save/load, edit lock, and the real ARASAAC symbol set.

## Running it

```bash
npm install
cp .env.example .env.local   # then add your Anthropic API key
npm run dev
```

Open the printed URL. The core grid and message bar work with no key. To use the
AI grid, set `VITE_ANTHROPIC_API_KEY` in `.env.local` and restart `npm run dev`.

Other scripts: `npm run typecheck`, `npm run build`, `npm run preview`.

## Design choices (locked in for this draft)

| Choice | Decision | Why |
|---|---|---|
| **Stack** | React + Vite + TypeScript | Component model maps cleanly onto the module contract; easy PWA path later. |
| **Scope** | Tier 0 *core proof* + AI grid | Prove the anchored/dynamic renderer + speak loop and the headline feature first; layer editing/persistence next. |
| **AI grid** | Real Anthropic API, `claude-sonnet-4-6` | The spec's named model (§7), chosen for speed/cost — a caregiver waits on tiles in real time. One constant in `src/services/ai.ts`. |
| **AI calls** | Direct from the browser (`dangerouslyAllowBrowser`) | Fine for local/personal use. For a public deploy, swap to a stateless log-nothing proxy (spec §6.4). |
| **Symbols** | ARASAAC active, emoji fallback | Real open pictograms via the ARASAAC API behind the `SymbolProvider` interface; emoji fill any gaps. Attribution shown in the footer. |
| **Persistence** | localStorage | Custom tiles, columns, and AI count are saved locally. (Spec's IndexedDB + offline image caching is the next step.) |
| **Edit lock** | Hold-to-edit (~0.6s) | Prevents the AAC user from accidentally editing/deleting tiles. |

### Privacy decisions already honoured (spec §6)

- The **only** thing that leaves the device is the scenario string the caregiver
  types — sent as the user message; all instructions live in a fixed system
  prompt. No names, history, or identifiers (§6.1).
- The AI feature is **opt-in**: a plain-language notice and an explicit Enable tap
  before any API call; the preference is stored locally (§6.3).
- Everything else is on-device; there is no backend.

## How to extend it

- **Add a module:** implement a component, add a `case` in
  `src/components/ModuleHost.tsx`, and place it on a board via a `ModuleContract`
  in `src/data/board.ts`. The contract already carries everything the renderer and
  (future) switch-scanner need.
- **Switch to ARASAAC symbols:** finish `ArasaacSymbolProvider` in
  `src/services/symbols.ts`, set `activeSymbolProvider`, and surface the required
  attribution (already stubbed in the footer).
- **Strengthen the safety filter:** `src/services/safety.ts` is a pure function —
  expand the list or add a model-based pass.

## Project layout

```
src/
  types/        module contract + board config types
  data/         core vocabulary (seed) + default board layout
  services/     tts · symbols (ARASAAC + emoji) · ai (Anthropic) · safety
  state/        MessageBarContext (buffer) · BoardStore (custom tiles, columns, edit mode)
  hooks/        useLongPress (hold-to-edit lock)
  components/   Board · ModuleHost · Tile · SymbolView · Modal · Toolbar · TileEditor · SettingsPanel
    modules/    MessageBar · EditableGrid · AiGrid · Keyboard
```
