import type { Tile, WordCategory } from '../types/module';
import { isSafeText } from './safety';

// AI grid generation (spec Tier 0, §6, §7) — CLIENT SIDE.
//
// The Anthropic API key is NOT in the browser. This module only POSTs the
// scenario string and a tile count to our own stateless proxy at /api/generate,
// which holds the key server-side and calls Anthropic (see api/generate.ts).
// The model, system prompt, and key all live on the server now; the client just
// sends the scenario, receives raw model text, and parses/safety-filters it.
//
// PRIVACY (spec §6.1): the ONLY thing that leaves the device is the scenario
// string the caregiver typed (plus the requested count). No names, history, or
// identifiers — ever.

const ENDPOINT = '/api/generate';

const VALID_CATEGORIES: readonly WordCategory[] = [
  'pronoun',
  'verb',
  'describing',
  'noun',
  'place',
  'social',
];

export class AiConfigError extends Error {}
export class AiError extends Error {}
// Thrown when the access passphrase is missing/rejected; the stored code is
// cleared first so the UI can prompt for it again.
export class AiAccessError extends AiError {}

// The access passphrase is stored locally (never in the app bundle) and sent as
// a header on each request. Cleared automatically when the server rejects it.
const ACCESS_KEY = 'aac.accessCode.v1';
export function getAccessCode(): string {
  return localStorage.getItem(ACCESS_KEY) ?? '';
}
export function setAccessCode(code: string): void {
  localStorage.setItem(ACCESS_KEY, code.trim());
}
export function clearAccessCode(): void {
  localStorage.removeItem(ACCESS_KEY);
}
export function hasAccessCode(): boolean {
  return getAccessCode() !== '';
}

// With a proxy the client can't see the key, so the feature is always offered;
// a missing/misconfigured key surfaces as a clear error when Generate is tapped.
export function isAiConfigured(): boolean {
  return true;
}

interface RawTile {
  label?: unknown;
  spokenText?: unknown;
  category?: unknown;
  symbolKeyword?: unknown;
}

// Defensive parse (spec §7: "Parse defensively; validate before render"). Handles
// stray prose or markdown fences by extracting the JSON object substring.
function parseTiles(text: string): Tile[] {
  let jsonText = text.trim();
  if (!jsonText.startsWith('{')) {
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new AiError('The AI response was not in the expected format. Try regenerating.');
    }
    jsonText = jsonText.slice(start, end + 1);
  }

  let parsed: { tiles?: unknown };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AiError('Could not read the AI response. Try regenerating.');
  }

  const rawTiles = Array.isArray(parsed.tiles) ? (parsed.tiles as RawTile[]) : [];

  const tiles: Tile[] = [];
  rawTiles.forEach((raw, index) => {
    if (typeof raw?.label !== 'string' || typeof raw?.spokenText !== 'string') return;
    const label = raw.label.trim();
    const spokenText = raw.spokenText.trim();
    if (label === '' || spokenText === '') return;

    const category: WordCategory = VALID_CATEGORIES.includes(raw.category as WordCategory)
      ? (raw.category as WordCategory)
      : 'noun';
    const symbolKeyword =
      typeof raw.symbolKeyword === 'string' && raw.symbolKeyword.trim() !== ''
        ? raw.symbolKeyword.trim()
        : label.split(/\s+/)[0];

    tiles.push({
      id: `ai.${Date.now()}.${index}`,
      label,
      spokenText,
      category,
      symbolKeyword,
    });
  });

  return tiles;
}

// Map the proxy's plain error codes to caregiver-readable messages.
function messageForError(code: unknown, status: number): string {
  switch (code) {
    case 'not_configured':
      return 'AI suggestions are not set up on the server yet. Contact whoever deployed this app.';
    case 'upstream_auth':
      return 'The server’s AI key was rejected. Contact whoever deployed this app.';
    case 'rate_limited':
      return 'The AI service is busy right now. Wait a moment and try again.';
    case 'bad_code':
      return 'That passphrase wasn’t accepted. Please enter it again.';
    case 'empty_scenario':
      return 'Type a situation first.';
    default:
      return status === 0
        ? 'Could not reach the AI service. Check your connection and try again.'
        : 'Something went wrong generating words. Try again.';
  }
}

// Generate tiles for a freeform scenario. Returns tiles that have passed the
// safety filter (spec Tier 0 / §6: screen generated suggestions before display).
export async function generateTiles(scenario: string, count = 9): Promise<Tile[]> {
  const trimmed = scenario.trim();
  if (trimmed === '') return [];

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-code': getAccessCode() },
      body: JSON.stringify({ scenario: trimmed, count }),
    });
  } catch {
    // Network failure (offline, DNS, etc.) — fetch rejects before any status.
    throw new AiError(messageForError(undefined, 0));
  }

  if (!res.ok) {
    let code: unknown;
    try {
      code = (await res.json())?.error;
    } catch {
      code = undefined;
    }
    if (code === 'bad_code' || res.status === 401) {
      clearAccessCode();
      throw new AiAccessError(messageForError('bad_code', res.status));
    }
    throw new AiError(messageForError(code, res.status));
  }

  let text = '';
  try {
    text = ((await res.json()) as { text?: unknown }).text as string;
  } catch {
    throw new AiError('Could not read the AI response. Try regenerating.');
  }
  if (typeof text !== 'string') {
    throw new AiError('Could not read the AI response. Try regenerating.');
  }

  const tiles = parseTiles(text);

  // Safety filter (spec §6 / Tier 0): drop anything that looks inappropriate
  // before it can ever render. Filter, don't error — a few dropped tiles are
  // fine; surfacing something unsafe is not.
  return tiles.filter((tile) => isSafeText(tile.label) && isSafeText(tile.spokenText));
}
