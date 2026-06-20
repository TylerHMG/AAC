# Modular AAC Platform — Capabilities Spec

> A free, web-based AAC (Augmentative and Alternative Communication) platform built around a **composable module system** instead of fixed boards. The headline feature is AI-generated vocabulary grids; the deeper bet is that a board assembled from interchangeable modules can be flexible *and* stable at the same time — fixing the rigidity that plagues existing AAC tools.

This document is the build spec. It's organised as: thesis → architecture → module catalogue → capability tiers (MVP / v1 / later) → cross-cutting requirements → tech notes. Build the tiers in order.

---

## 1. Product thesis

Existing AAC grids are rigid in two specific ways:

1. **Locked vocabulary structure** — the layout is fixed by the vendor and hard to adapt.
2. **Deep folder trees** — changing context (e.g. moving from "at home" to "playing a game") means navigating several layers down.

This platform attacks both. A board is a **large grid populated with modules**. Context changes happen *in place* (a region of the board swaps its content) rather than by diving down a folder tree, and the composition of the board is editable rather than vendor-locked.

**Critical design principle — rigidity is not purely a flaw.** Many users navigate by motor memory ("want" is always in the same place), and for them, consistency is the feature. The solution is not to make everything dynamic, but to distinguish two module behaviours:

- **Anchored modules** — fixed position, never move. Preserve muscle memory (core vocabulary, controls).
- **Dynamic modules** — content swaps inside a region that itself stays put. The scenario changes; the user's hand still knows where to reach (AI grids, topic grids, autocomplete).

Every design decision below should preserve the ability to lock a board into total consistency for users who need it, while allowing dynamism for users who benefit from it.

---

## 2. Core architecture

### 2.1 The board as a grid of modules

- A board is a coarse **cell grid** (suggested default 12×8, configurable).
- Each module occupies a rectangular block of N×M cells.
- Use cell-based placement, **not** free pixel positioning. It matches the "large grid" mental model, keeps layouts tidy, reflows cleanly across screen sizes (resize cells, don't reposition), and makes scan-order tractable.
- Boards reflow responsively by changing cell size; on very small screens, modules may collapse or stack according to declared minimum sizes.

### 2.2 The message bar is the hub

Almost every module either **writes** to a shared output buffer (the message/sentence bar) or **reads** from it to offer suggestions. Treat the message bar as the central object that makes a pile of heterogeneous modules behave like one coherent device.

- **Writers:** core grid, topic grids, AI grid, quick phrases, keyboard.
- **Readers:** autocomplete, next-word prediction.
- The message bar accumulates selections, speaks the assembled phrase, and provides speak / backspace / clear controls.
- A tile's **displayed label** and its **spoken text** are independent (a tile may show "bathroom" but speak "I need to use the toilet, please").

### 2.3 Module contract

Every module type should implement a shared interface so the board can host them uniformly. At minimum each module declares:

- **Type** (core grid, AI grid, keyboard, autocomplete, etc.)
- **Footprint** — cells occupied, and minimum size for responsive collapse.
- **Behaviour** — anchored vs dynamic.
- **Scan order** — its position in the board-wide switch-scanning traversal, and the internal traversal of its own cells.
- **Buffer relationship** — writes to / reads from / neither.

### 2.4 Scan order across modules (design in early, even if built later)

For switch scanning (essential for a real AAC), the board needs a **defined traversal** across heterogeneous modules: scanning steps module-by-module, then cell-by-cell within a module. This is very hard to retrofit, so the *concept* must exist from day one — each module declares its scan order — even if the actual scanning interaction ships in a later tier.

### 2.5 Templates over blank canvases

Most parents and therapists will not compose a board from scratch — and forcing them to is its own kind of rigidity. Ship **pre-composed board templates** (e.g. "core + AI fringe", "keyboard + prediction", "topic explorer") that people start from and then tweak. The module system provides composability; templates provide approachability. Ship both.

---

## 3. Module catalogue

| Module | Role | Behaviour | Buffer |
|---|---|---|---|
| Message / sentence bar | Output hub; speak, backspace, clear | Anchored | — |
| Core grid | High-frequency core vocabulary (I, want, more, stop, help, yes, no, done) | Anchored | Writes |
| Topic grid (static) | Pre-made, scenario-specific boards ("non-AI specific grids") | Dynamic | Writes |
| AI grid | LLM-generated tiles from a freeform scenario prompt | Dynamic | Writes |
| Quick phrases | Full pre-stored sentences (greetings, "leave me alone, please") | Anchored or dynamic | Writes |
| Recents / frequents | Auto-populated from usage | Dynamic | Writes |
| Keyboard | Pop-out or inline text entry | Anchored (popout trigger) | Writes |
| Autocomplete column | Word completions based on current buffer | Dynamic | Reads |
| Next-word prediction | Predicts likely next word/phrase | Dynamic | Reads |
| Folder / link tile | Opens another board | Anchored | — |
| Controls strip | Regenerate AI, lock/unlock, settings | Anchored | — |

---

## 4. Capability tiers

### Tier 0 — MVP (prove the thesis)

Goal: a usable single-board AAC with the module system and the headline AI feature working end to end.

- **Module-based board renderer** — coarse cell grid, modules in rectangular regions, anchored vs dynamic distinction.
- **Message bar module** — accumulate, speak, backspace, clear.
- **Text-to-speech** — browser Web Speech API to start; speak individual tiles and assembled phrases.
- **Core grid module** — a fixed, always-visible core vocabulary set.
- **AI grid module** — freeform scenario prompt → LLM returns tiles (label, symbol, spoken text, word-type/category). Output rendered into a dynamic region.
- **AI output safety filter** — screen generated suggestions for inappropriate content before display (users are often children and vulnerable adults).
- **Manual board creation & editing** — add/remove/edit tiles; edit label, spoken text, symbol, colour.
- **Save / load boards** — local persistence.
- **Edit lock** — gate editing/settings behind a long-press or PIN so users can't accidentally delete tiles or exit.
- **Responsive layout** — works across phone, tablet, desktop by reflowing cell size.
- **Symbol set** — use **ARASAAC** (https://arasaac.org). 18,000+ symbols, public REST API at `api.arasaac.org`, supports 17 languages. Licensed CC BY-NC-SA — compatible with a free, non-monetised, open-source project. **Do not** bundle or query proprietary sets (PCS, SymbolStix) — they can't be redistributed. Emoji are a stopgap only. Required attribution on the credits/about screen: *"Pictograms courtesy of ARASAAC (https://arasaac.org), property of the Government of Aragon, created by Sergio Palao, distributed under CC BY-NC-SA."*

### Tier 1 — A genuinely functional AAC

- **Offline support** — PWA with service worker + IndexedDB. Cache boards, symbols, and **pre-generated TTS audio** locally so saved boards work with no connection. Treat offline as foundational, not a bolt-on.
- **Keyboard module** with **autocomplete column** and **next-word prediction** (the buffer reader/writer loop).
- **Quick-phrases module** and **recents/frequents module**.
- **Board navigation** — folder/link tiles that open other boards.
- **Speech customization** — voice choice (incl. age-appropriate/child voices), rate, pitch, volume.
- **Pronunciation override** — fix how TTS says names and unusual words.
- **Colour-coding by word type** — support the Fitzgerald Key convention (nouns yellow, verbs green, etc.) as an option.
- **Board templates** — ship the pre-composed starting layouts described in §2.5.
- **Selection feedback** — visual highlight, optional click sound, optional haptic.
- **Export / import / backup** — move or back up a user's whole setup, not just a single board.

### Tier 2 — Alternative access & multi-user

- **Switch scanning** — the board-wide traversal from §2.4, made real. Row/block scan then cell scan; configurable scan speed and order; one- and two-switch modes.
- **Dwell / hold selection** and **keyboard navigation**.
- **User profiles** — multiple users per device, each with their own boards, vocabulary, voice, and access settings.
- **Board sharing** — share boards/templates between users (export format + a simple share mechanism).
- **Customizable grid size** — per-user cell count and tile size.

### Tier 3 — Reach & polish

- **Multilingual** — symbols + speech in multiple languages (ARASAAC supports this; pairs well with the symbol choice in Tier 0).
- **Eye-gaze support** (hard; explicitly later).
- **Abbreviation expansion** for literate users.
- **WCAG AA polish** — high-contrast mode, scalable text, dyslexia-friendly font option, audited tap-target sizes.

---

## 5. Cross-cutting requirements

These are not features; they constrain the whole build and should be considered from the first commit.

### Privacy (especially the AI feature)
- The AI feature sends scenario prompts to an LLM. Users are often vulnerable, frequently minors.
- Decide and document exactly **what is sent**, whether prompts are **logged**, and for how long.
- Make AI **optional** and ensure the app **degrades gracefully offline** (static topic grids and saved boards must work with AI unavailable).
- Filter AI output so it cannot surface inappropriate suggestions (also listed in Tier 0).

### Accessibility (target WCAG AA)
- High-contrast mode, scalable text, dyslexia-friendly font option.
- Sufficient tap-target sizes (AAC users may have limited motor control).
- Don't make accessibility a Tier 3 afterthought — the scanning *concept* and tap-target sizing belong in the foundation even where full features come later.

### Offline architecture
- PWA + service worker + IndexedDB is the natural fit and also gives "works across screen sizes" largely for free.
- Pre-generate and cache TTS audio for saved boards so speech works offline (browser TTS may not be available offline on all platforms — plan for cached audio fallback).

### Responsive / multi-screen
- Single codebase reflowing by cell size across phone / tablet / desktop.
- Declare per-module minimum sizes so layouts collapse sensibly on small screens.

---

## 6. Privacy

Privacy is a first-class requirement, not an afterthought. Users are a uniquely sensitive population — often children, often non-verbal individuals who cannot advocate for themselves, often with medical or developmental information implicit in their communication. The architecture is already privacy-friendly (local-first, no accounts); this section defines the rules that keep it that way.

### 6.1 What leaves the device

The AI grid feature is the **only** external data touch point. When a caregiver types a scenario prompt, that string is sent to the Anthropic API. Nothing else leaves the device. Specifically, the following must **never** be included in API calls:

- User names or profile identifiers
- Board history or communication logs
- Any personal or medical information
- Device identifiers

The prompt must contain **only** the scenario string the caregiver typed. Even if adding context would improve AI output, do not send it.

### 6.2 On-device storage only

All boards, vocabulary, user profiles, settings, and communication history are stored locally (IndexedDB). The app must not have a backend that stores user data. If board sharing is added later, implement it as file export/import — not cloud accounts or server-side storage.

### 6.3 AI feature is opt-in, not opt-on

On first use of the AI grid module, show a plain-language notice before any API call is made:

> *"This feature sends the scenario description you type to an AI service to generate word suggestions. No personal information is sent. The rest of the app works fully without this feature."*

Require an explicit tap to enable. Store that preference locally. Users who decline get a static topic-grid fallback — the app must be fully functional without AI.

### 6.4 No proxying or logging of API traffic

Call the Anthropic API directly from the client. If a proxy is ever introduced (e.g. to protect an API key), it must be stateless and log nothing. The goal is that no server operated by this project ever sees user prompts.

### 6.5 Children (COPPA and equivalents)

The app will be used by and for children under 13. The safest compliance path is to collect no personal data at all — which the local-first architecture already achieves. Do not add any analytics, crash reporting, or telemetry that could identify a user or device without explicit legal review.

### 6.6 What the app can honestly promise users

Build a plain-language privacy notice (not just a legal document) alongside any legal text. Caregivers make trust decisions quickly and deserve clarity. The notice should state:

- Everything you communicate stays on your device.
- Nothing about how you use the app is sent anywhere.
- The optional AI feature sends only the scenario description you type — no personal information.
- You can use the full app without the AI feature if you want everything kept on-device.

This is a promise the architecture can actually keep. Do not add features that break it without revisiting this section.

### 6.7 Anthropic API data handling

Since scenario prompts are sent to Anthropic, their privacy policy and data retention terms apply to that data. Verify Anthropic's current API terms (particularly whether inputs are used for training) and link to them from the app's privacy notice. You are not in control of server-side handling, so transparency with users about this single external touch point is essential.

---

## 7. Suggested tech stack (for Claude Code)

- **App shell:** PWA (installable, offline-capable). React or Svelte; component model maps cleanly onto the module contract.
- **Storage:** IndexedDB for boards, symbols, cached audio; a small abstraction layer so persistence is swappable.
- **TTS:** Web Speech API first; add cached pre-generated audio for offline.
- **AI:** Anthropic API (`claude-sonnet-4-6` is a sensible default for speed/cost). Prompt the model to return **strict JSON** — an array of tiles each with `label`, `spokenText`, `symbol` (or symbol search keyword), and `category` (action / social / feeling / question / object, or a Fitzgerald word-type). Parse defensively; validate before render; run the safety filter on the parsed output.
- **Symbols:** ARASAAC public REST API (`api.arasaac.org`). Query by keyword — the AI module returns a `symbolKeyword`, the app queries the API and loads the SVG/PNG. For offline support, cache fetched symbols in IndexedDB on first use rather than bundling the full library upfront.

### Starter prompt shape for the AI grid module
> Generate N AAC tiles for a user in this scenario: "{scenario}". Return only JSON: an array of objects with `label` (1–2 words shown on the tile), `spokenText` (what is spoken when tapped), `category` (one of: action, social, feeling, question, object), and `symbolKeyword` (a single word to look up an icon). No prose, no markdown fences.

---

## 8. Open decisions to settle before/early in the build

1. **Grid default dimensions** and how per-user resizing maps onto module footprints.
2. **AI region vs whole board** — confirmed direction: AI fills a *dynamic region* while core stays *anchored*. Lock this in the renderer.
3. **Symbol library: decided — ARASAAC.** CC BY-NC-SA, compatible with free/open-source. Query via the public REST API (`api.arasaac.org`) rather than bundling. Add the required attribution line to the credits/about screen. App code can be licenced MIT/Apache 2.0 separately — the NC clause applies to the symbols only.
4. **TTS offline strategy** — which platforms get live Web Speech vs cached audio.
5. **AI privacy policy** — the concrete data-handling answers from §5.
