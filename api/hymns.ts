/**
 * The shared hymn list: hymns added or changed in the editor, seen by every
 * device. Anyone can read it; changing it needs the editor passcode.
 *
 * Storage is Upstash Redis, connected from the Vercel dashboard (Storage tab),
 * which supplies the URL and token. The passcode is the HYMN_EDITOR_PASSCODE
 * environment variable.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Hymn } from '../src/types/hymn.js';

const HYMNS_KEY = 'sanctum:hymns';
const MAX_FAILURES = 10;
const LOCKOUT_SECONDS = 15 * 60;
const MAX_IMPORT = 500;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const PASSCODE = process.env.HYMN_EDITOR_PASSCODE?.trim();

type ErrorCode = 'not-configured' | 'no-passcode' | 'passcode' | 'locked' | 'invalid' | 'storage';

function reply(status: number, body: object): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function fail(status: number, error: ErrorCode, message: string): Response {
  return reply(status, { error, message });
}

class StorageError extends Error {}

async function redis<T>(...command: (string | number)[]): Promise<T> {
  let res: Response;
  try {
    res = await fetch(REDIS_URL!, {
      method: 'POST',
      headers: { authorization: `Bearer ${REDIS_TOKEN}` },
      body: JSON.stringify(command),
    });
  } catch {
    throw new StorageError('unreachable');
  }
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new StorageError(data.error ?? `status ${res.status}`);
  return data.result as T;
}

// ── Validation: keep only the fields the app uses, within sane sizes ──

const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const isOptionalText = (v: unknown, max: number) => v === undefined || isText(v, max);
const isOptionalStanza = (v: unknown) => v === undefined || v === null || isText(v, 5000);
const isStanzas = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= 80 && v.every((s) => isText(s, 5000));

function cleanHymn(value: unknown): Hymn | null {
  if (!value || typeof value !== 'object') return null;
  const h = value as Record<string, unknown>;
  const valid =
    Number.isSafeInteger(h.number) &&
    (h.number as number) > 0 &&
    isText(h.title, 300) &&
    h.title.trim() !== '' &&
    isStanzas(h.verses) &&
    h.verses.length > 0 &&
    isOptionalText(h.displayNumber, 40) &&
    isOptionalText(h.author, 300) &&
    isOptionalText(h.tune, 200) &&
    isOptionalText(h.secondaryLanguage, 60) &&
    isOptionalText(h.secondaryTitle, 300) &&
    isOptionalStanza(h.refrain) &&
    isOptionalStanza(h.secondaryRefrain) &&
    (h.secondaryVerses === undefined || isStanzas(h.secondaryVerses)) &&
    (h.year === undefined || Number.isSafeInteger(h.year)) &&
    (h.book === undefined || h.book === 'main' || h.book === 'iom' || h.book === 'am');
  if (!valid) return null;

  const hymn: Hymn = {
    number: h.number as number,
    displayNumber: h.displayNumber as string | undefined,
    unnumbered: h.unnumbered === true || undefined,
    book: h.book as Hymn['book'],
    title: h.title as string,
    author: h.author as string | undefined,
    year: h.year as number | undefined,
    tune: h.tune as string | undefined,
    verses: h.verses as string[],
    refrain: (h.refrain as string | null | undefined) ?? null,
    secondaryLanguage: h.secondaryLanguage as string | undefined,
    secondaryTitle: h.secondaryTitle as string | undefined,
    secondaryVerses: h.secondaryVerses as string[] | undefined,
    secondaryRefrain: h.secondaryRefrain as string | null | undefined,
  };
  // Drops the undefined fields
  return JSON.parse(JSON.stringify(hymn)) as Hymn;
}

// ── Passcode, with a lockout after repeated wrong guesses ──

const digest = (s: string) => createHash('sha256').update(s).digest();

async function checkPasscode(request: Request): Promise<Response | null> {
  if (!PASSCODE) {
    return fail(503, 'no-passcode', 'Editing is not switched on yet: add HYMN_EDITOR_PASSCODE in Vercel and redeploy.');
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const failuresKey = `sanctum:failures:${ip}`;
  const failures = Number(await redis<string | null>('GET', failuresKey)) || 0;
  if (failures >= MAX_FAILURES) {
    return fail(429, 'locked', 'Too many wrong passcodes. Try again in 15 minutes.');
  }
  const given = request.headers.get('x-editor-passcode') ?? '';
  if (timingSafeEqual(digest(given.trim()), digest(PASSCODE))) return null;

  const count = await redis<number>('INCR', failuresKey);
  if (count === 1) await redis('EXPIRE', failuresKey, LOCKOUT_SECONDS);
  return fail(401, 'passcode', 'That passcode is not right.');
}

// ── Handlers ──

export async function GET(): Promise<Response> {
  if (!REDIS_URL || !REDIS_TOKEN) return fail(503, 'not-configured', 'The shared hymn list is not connected.');
  try {
    const flat = await redis<string[]>('HGETALL', HYMNS_KEY);
    const hymns: Hymn[] = [];
    for (let i = 1; i < flat.length; i += 2) {
      try {
        const hymn = cleanHymn(JSON.parse(flat[i]));
        if (hymn) hymns.push(hymn);
      } catch {
        // Skip an unreadable entry rather than lose the whole list
      }
    }
    return reply(200, { hymns, editable: !!PASSCODE });
  } catch {
    return fail(502, 'storage', 'The shared hymn list did not respond.');
  }
}

type Action =
  | { action: 'check' }
  | { action: 'save'; hymn: unknown; replaces?: unknown }
  | { action: 'delete'; number: unknown }
  | { action: 'import'; hymns: unknown };

export async function POST(request: Request): Promise<Response> {
  if (!REDIS_URL || !REDIS_TOKEN) return fail(503, 'not-configured', 'The shared hymn list is not connected.');
  try {
    const denied = await checkPasscode(request);
    if (denied) return denied;

    const body = (await request.json().catch(() => null)) as Action | null;
    switch (body?.action) {
      case 'check':
        return reply(200, { ok: true });

      case 'save': {
        const hymn = cleanHymn(body.hymn);
        if (!hymn) return fail(400, 'invalid', 'That hymn is missing a title or verses, or is too long.');
        await redis('HSET', HYMNS_KEY, String(hymn.number), JSON.stringify(hymn));
        // Renumbered while editing: the old entry goes, after the new one is safely stored
        if (Number.isSafeInteger(body.replaces) && body.replaces !== hymn.number) {
          await redis('HDEL', HYMNS_KEY, String(body.replaces));
        }
        return reply(200, { ok: true });
      }

      case 'delete': {
        if (!Number.isSafeInteger(body.number)) return fail(400, 'invalid', 'No hymn number was given.');
        await redis('HDEL', HYMNS_KEY, String(body.number));
        return reply(200, { ok: true });
      }

      case 'import': {
        if (!Array.isArray(body.hymns) || body.hymns.length === 0 || body.hymns.length > MAX_IMPORT) {
          return fail(400, 'invalid', `Send between 1 and ${MAX_IMPORT} hymns at a time.`);
        }
        const hymns = body.hymns.map(cleanHymn);
        if (hymns.some((h) => !h)) return fail(400, 'invalid', 'One of the hymns is missing a title or verses, or is too long.');
        await redis('HSET', HYMNS_KEY, ...hymns.flatMap((h) => [String(h!.number), JSON.stringify(h)]));
        return reply(200, { ok: true, count: hymns.length });
      }

      default:
        return fail(400, 'invalid', 'Unknown request.');
    }
  } catch (err) {
    if (err instanceof StorageError) return fail(502, 'storage', 'The shared hymn list did not respond.');
    throw err;
  }
}
