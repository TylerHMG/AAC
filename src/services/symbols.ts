// Symbol resolution layer.
//
// Active provider: ARASAAC (https://arasaac.org) — 18,000+ open pictograms via a
// public REST API (spec §7 / Tier 0). Emoji remain as an automatic fallback for
// any keyword ARASAAC can't match or when the network is unavailable, so the UI
// is never blank.
//
// Required attribution lives on the credits/about screen (the footer in App.tsx),
// per the CC BY-NC-SA licence.

export type SymbolRef =
  | { kind: 'emoji'; value: string }
  | { kind: 'image'; url: string; alt: string };

export interface SymbolProvider {
  readonly name: string;
  // May be sync (emoji) or async (network fetch) — callers await the result.
  resolve(keyword: string): SymbolRef | Promise<SymbolRef>;
  // Resolve a specific, already-chosen pictogram by id (set in the tile editor).
  resolveById?(id: number, alt?: string): SymbolRef;
}

// A single ARASAAC search hit, used by the tile editor's symbol picker.
export interface SymbolSearchResult {
  id: number;
  url: string;
  keyword: string;
}

// --- Emoji provider (fallback) ----------------------------------------------

const EMOJI: Record<string, string> = {
  i: '🙋', you: '👉', want: '🤲', more: '➕', stop: '✋', go: '🟢',
  help: '🆘', like: '👍', yes: '✅', no: '❌', finished: '🏁', please: '🙏',
  eat: '🍴', drink: '🥤', water: '💧', food: '🍽️', hungry: '😋', thirsty: '🥵',
  play: '🧸', toy: '🪀', ball: '⚽', book: '📖', music: '🎵', tv: '📺',
  happy: '😀', sad: '😢', angry: '😠', tired: '😴', scared: '😨', hurt: '🤕',
  bathroom: '🚻', toilet: '🚽', wash: '🧼', sleep: '🛏️', home: '🏠', outside: '🌳',
  hot: '🔥', cold: '🧊', big: '🔵', little: '🔹', up: '⬆️', down: '⬇️',
  mom: '👩', dad: '👨', friend: '🧑‍🤝‍🧑', teacher: '🧑‍🏫', dog: '🐶', cat: '🐱',
  car: '🚗', school: '🏫', park: '🏞️', store: '🏬', clothes: '👕', shoes: '👟',
  question: '❓', where: '📍', what: '❔', who: '🧑', when: '🕐', why: '💭',
};

const FALLBACK_EMOJI = '🔲';

export class EmojiSymbolProvider implements SymbolProvider {
  readonly name = 'emoji';
  resolve(keyword: string): SymbolRef {
    const key = keyword.trim().toLowerCase();
    return { kind: 'emoji', value: EMOJI[key] ?? FALLBACK_EMOJI };
  }
}

// --- ARASAAC provider (active) ----------------------------------------------

const ARASAAC_SEARCH = (kw: string) =>
  `https://api.arasaac.org/api/pictograms/en/bestsearch/${encodeURIComponent(kw)}`;
const ARASAAC_IMAGE = (id: number) =>
  `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;

const ID_CACHE_KEY = 'aac.arasaac.ids.v1';

interface ArasaacHit {
  _id: number;
}

export class ArasaacSymbolProvider implements SymbolProvider {
  readonly name = 'arasaac';
  private emoji = new EmojiSymbolProvider();
  private memory = new Map<string, SymbolRef>();
  // Persistent keyword → pictogram id cache (null = searched, no match). Images
  // themselves are served from a CDN and cached by the browser, so we only need
  // to remember the id. Offline image (blob) caching is a later, larger step.
  private ids: Map<string, number | null>;

  constructor() {
    this.ids = loadIdCache();
  }

  resolveById(id: number, alt = ''): SymbolRef {
    return { kind: 'image', url: ARASAAC_IMAGE(id), alt };
  }

  async resolve(keyword: string): Promise<SymbolRef> {
    const key = keyword.trim().toLowerCase();
    if (key === '') return this.emoji.resolve(key);

    const remembered = this.memory.get(key);
    if (remembered) return remembered;

    if (this.ids.has(key)) {
      const id = this.ids.get(key)!;
      const ref = id == null ? this.emoji.resolve(key) : this.resolveById(id, key);
      this.memory.set(key, ref);
      return ref;
    }

    try {
      const id = await this.searchFirstId(key);
      this.ids.set(key, id); // cache the id, or null for "no match"
      saveIdCache(this.ids);
      const ref = id == null ? this.emoji.resolve(key) : this.resolveById(id, key);
      this.memory.set(key, ref);
      return ref;
    } catch {
      // Network/parse error — fall back to emoji but DON'T cache, so a later
      // online attempt can still find the real pictogram.
      return this.emoji.resolve(key);
    }
  }

  private async searchFirstId(keyword: string): Promise<number | null> {
    const res = await fetch(ARASAAC_SEARCH(keyword));
    if (!res.ok) {
      // 404 from bestsearch means "no pictogram for this word".
      if (res.status === 404) return null;
      throw new Error(`ARASAAC search failed: ${res.status}`);
    }
    const hits = (await res.json()) as ArasaacHit[];
    return Array.isArray(hits) && hits.length > 0 ? hits[0]._id : null;
  }
}

// Search ARASAAC for candidate pictograms (tile-editor symbol picker).
export async function searchSymbols(keyword: string, limit = 12): Promise<SymbolSearchResult[]> {
  const key = keyword.trim();
  if (key === '') return [];
  const res = await fetch(
    `https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(key)}`,
  );
  if (!res.ok) return [];
  const hits = (await res.json()) as ArasaacHit[];
  if (!Array.isArray(hits)) return [];
  return hits.slice(0, limit).map((hit) => ({
    id: hit._id,
    url: ARASAAC_IMAGE(hit._id),
    keyword: key,
  }));
}

function loadIdCache(): Map<string, number | null> {
  try {
    const raw = localStorage.getItem(ID_CACHE_KEY);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw) as Record<string, number | null>));
  } catch {
    return new Map();
  }
}

function saveIdCache(ids: Map<string, number | null>): void {
  try {
    localStorage.setItem(ID_CACHE_KEY, JSON.stringify(Object.fromEntries(ids)));
  } catch {
    // storage full / unavailable — ignore; the in-memory cache still works.
  }
}

// The single switch point. Swap to `new EmojiSymbolProvider()` to go back to
// emoji-only (e.g. for fully-offline use without cached pictograms).
export const activeSymbolProvider: SymbolProvider = new ArasaacSymbolProvider();
