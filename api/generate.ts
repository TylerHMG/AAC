import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Stateless, log-nothing AI proxy (spec §6 / deployment plan).
//
// The Anthropic API key lives ONLY here, as the server-side env var
// ANTHROPIC_API_KEY (set in the Vercel dashboard — never VITE_-prefixed, so it
// is never exposed to the browser bundle). The client sends just the scenario
// string and a tile count; this function builds the request, calls Anthropic,
// and returns the raw model text. It stores nothing and logs no request content.

const MODEL = 'claude-sonnet-4-6';

// PRIVACY (spec §6.1): all generation instructions live in this fixed system
// prompt. The only user-derived data that reaches the model is the scenario
// string — no names, history, or identifiers. Keeping the prompt server-side
// also means the client cannot substitute its own instructions.
const SYSTEM_PROMPT = [
  'You generate vocabulary tiles for an AAC (Augmentative and Alternative',
  'Communication) board. The user is often a child or a vulnerable adult who is',
  'non-verbal and communicates by tapping tiles.',
  '',
  'Given a short scenario, return tiles that would help this person communicate',
  'in that situation: useful words and short phrases, age-appropriate and kind.',
  '',
  'Return ONLY a JSON object of this exact shape, with no prose and no markdown',
  'fences:',
  '{"tiles":[{"label":"...","spokenText":"...","category":"...","symbolKeyword":"..."}]}',
  '',
  'Rules for each tile:',
  '- label: 1-2 words shown on the tile.',
  '- spokenText: what is spoken aloud when tapped (may be a fuller phrase).',
  '- category: the Fitzgerald word type, one of:',
  '    pronoun    (people/pronouns: I, you, he, Mom)',
  '    verb       (actions: want, go, eat)',
  '    describing (adjectives/feelings: big, happy, hot)',
  '    noun       (things/objects: ball, juice, car)',
  '    place      (places: home, park, school)',
  '    social     (little/social words: please, hello, in, on)',
  '- symbolKeyword: a single common English word to look up an icon.',
  'Never include anything unsafe, sexual, violent, or otherwise inappropriate.',
].join('\n');

// Mirror the client's count bounds so a tampered request can't ask for a huge
// (costly) generation.
const COUNT_MIN = 4;
const COUNT_MAX = 20;
const COUNT_DEFAULT = 9;
const SCENARIO_MAX = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Misconfigured deployment — the env var was never set.
    return res.status(503).json({ error: 'not_configured' });
  }

  // Access passphrase. If AAC_ACCESS_CODE is set on the server, callers must send
  // a matching x-access-code header. This keeps the open URL from spending your
  // credits — only people you gave the passphrase to can generate. (If the env
  // var is unset, the proxy is open — fine for purely personal/local use.)
  const requiredCode = process.env.AAC_ACCESS_CODE;
  if (requiredCode) {
    const header = req.headers['x-access-code'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided || provided !== requiredCode) {
      return res.status(401).json({ error: 'bad_code' });
    }
  }

  const body = (req.body ?? {}) as { scenario?: unknown; count?: unknown };
  const scenario = typeof body.scenario === 'string' ? body.scenario.trim().slice(0, SCENARIO_MAX) : '';
  if (scenario === '') {
    return res.status(400).json({ error: 'empty_scenario' });
  }
  const rawCount = typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : COUNT_DEFAULT;
  const count = Math.min(COUNT_MAX, Math.max(COUNT_MIN, Math.round(rawCount)));

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${scenario}\n\n(Generate about ${count} tiles.)` }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Return only the model text; parsing + safety filtering happen client-side.
    return res.status(200).json({ text });
  } catch (err) {
    // Map upstream failures to plain codes WITHOUT logging request content.
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(502).json({ error: 'upstream_auth' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    return res.status(502).json({ error: 'upstream_error' });
  }
}
