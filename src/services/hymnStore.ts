import type { Hymn } from '../types/hymn';

/**
 * Hymns added or changed in the editor.
 *
 * When the site is connected to the shared list (/api/hymns), hymns are saved
 * there and every device keeps a copy, so projection still works offline.
 * Without it, or when a save can't reach it, they are kept in this browser
 * only and can be shared later.
 */

const LOCAL_KEY = 'church-projection-custom-hymns'; // this browser only
const SHARED_KEY = 'church-projection-shared-hymns'; // copy of the shared list
const PASSCODE_KEY = 'church-projection-editor-passcode';
const API = '/api/hymns';
const CHANGED = 'sanctum:hymns-changed';
const IMPORT_BATCH = 200;

/**
 * checking — first contact not finished yet
 * shared   — connected; saves go to every device
 * offline  — connected before or expected, but not reachable now
 * local    — this site has no shared list; saves stay in this browser
 */
export type SyncState = 'checking' | 'shared' | 'offline' | 'local';

/** Where a save ended up. `fallback` means the shared list was unreachable. */
export type SaveResult = 'shared' | 'local' | 'fallback';

export class HymnStoreError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Failures that mean "save on this computer instead" rather than "stop"
const FALLBACK_CODES = new Set(['offline', 'storage', 'not-configured']);
const OFFLINE_MESSAGE = 'Can’t reach the shared hymn list. Check the internet connection and try again.';

function isHymnLike(value: unknown): value is Hymn {
  const h = value as Hymn;
  return (
    !!h &&
    typeof h.number === 'number' &&
    typeof h.title === 'string' &&
    Array.isArray(h.verses) &&
    h.verses.every((v) => typeof v === 'string')
  );
}

function readList(key: string): Hymn[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isHymnLike) : [];
  } catch {
    return [];
  }
}

let state: SyncState = 'checking';
let editable = true;
let shared: Hymn[] = readList(SHARED_KEY);
let lastSync = 0;
let inflight: Promise<void> | null = null;

const emit = () => window.dispatchEvent(new Event(CHANGED));

/** Called whenever the hymn lists or the connection state change. */
export function onHymnsChanged(listener: () => void): () => void {
  window.addEventListener(CHANGED, listener);
  return () => window.removeEventListener(CHANGED, listener);
}

export function getSyncStatus(): { state: SyncState; editable: boolean } {
  return { state, editable };
}

function setShared(hymns: Hymn[]): void {
  shared = hymns;
  try {
    localStorage.setItem(SHARED_KEY, JSON.stringify(hymns));
  } catch {
    // Storage full or blocked: the copy in memory still serves this session
  }
}

function mergeInto(list: Hymn[], incoming: Hymn[]): Hymn[] {
  const byNumber = new Map(list.map((h) => [h.number, h]));
  incoming.forEach((h) => byNumber.set(h.number, h));
  return [...byNumber.values()];
}

function setLocal(hymns: Hymn[]): void {
  if (hymns.length === 0) localStorage.removeItem(LOCAL_KEY);
  else localStorage.setItem(LOCAL_KEY, JSON.stringify(hymns));
}

/** Everything added or changed: the shared list, with this computer's unshared changes on top. */
export function getCustomHymns(): Hymn[] {
  const local = readList(LOCAL_KEY);
  return local.length === 0 ? shared : mergeInto(shared, local);
}

export function isSharedHymn(hymnNumber: number): boolean {
  return shared.some((h) => h.number === hymnNumber);
}

/** Hymns saved on this computer that the other devices don't have yet. */
export function getLocalOnlyHymns(): Hymn[] {
  return state === 'local' ? [] : readList(LOCAL_KEY);
}

// ── Editor passcode, remembered on this device once it works ──

export function hasPasscode(): boolean {
  try {
    return !!localStorage.getItem(PASSCODE_KEY);
  } catch {
    return false;
  }
}

export function setPasscode(passcode: string): void {
  localStorage.setItem(PASSCODE_KEY, passcode.trim());
}

// ── Talking to the shared list ──

async function post(body: object): Promise<void> {
  let res: Response;
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-editor-passcode': localStorage.getItem(PASSCODE_KEY) ?? '' },
      body: JSON.stringify(body),
    });
  } catch {
    state = 'offline';
    throw new HymnStoreError('offline', OFFLINE_MESSAGE);
  }
  if (res.ok) {
    state = 'shared';
    return;
  }
  const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
  if (res.status === 401) localStorage.removeItem(PASSCODE_KEY);
  if (!data?.error) {
    state = 'offline';
    throw new HymnStoreError('offline', OFFLINE_MESSAGE);
  }
  if (data.error === 'not-configured') state = 'local';
  if (data.error === 'storage') state = 'offline';
  throw new HymnStoreError(data.error, data.message ?? OFFLINE_MESSAGE);
}

/** Fetch the latest shared list. Safe to call often; overlapping calls share one request. */
export function syncSharedHymns(): Promise<void> {
  inflight ??= (async () => {
    try {
      const res = await fetch(API, { headers: { accept: 'application/json' }, cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { hymns?: unknown; editable?: boolean; error?: string } | null;
      if (res.ok && Array.isArray(data?.hymns)) {
        setShared(data.hymns.filter(isHymnLike));
        editable = data.editable !== false;
        state = 'shared';
      } else if (data?.error === 'not-configured' || res.ok || res.status === 404) {
        // No shared list on this site (or a local dev server without /api)
        state = 'local';
      } else {
        state = 'offline';
      }
    } catch {
      state = 'offline';
    } finally {
      lastSync = Date.now();
      inflight = null;
      emit();
    }
  })();
  return inflight;
}

/** Sync unless it happened in the last few seconds — for moments the operator is about to look for a hymn. */
export function refreshHymnsSoon(): void {
  if (Date.now() - lastSync > 15_000) void syncSharedHymns();
}

/** Keep this device's copy current: on start, when the window comes back into view, and every two minutes. */
export function startHymnSync(): void {
  void syncSharedHymns();
  const whenVisible = () => {
    if (document.visibilityState === 'visible') refreshHymnsSoon();
  };
  window.addEventListener('focus', whenVisible);
  document.addEventListener('visibilitychange', whenVisible);
  setInterval(whenVisible, 2 * 60_000);
  // Another tab of the app changed something
  window.addEventListener('storage', (e) => {
    if (e.key === SHARED_KEY) shared = readList(SHARED_KEY);
    if (e.key === SHARED_KEY || e.key === LOCAL_KEY) emit();
  });
}

// ── Changes ──

/**
 * Save a hymn — to every device when connected, otherwise on this computer.
 * `replaces` is the old number of a hymn that was renumbered while editing.
 * Throws HymnStoreError for a wrong passcode or a rejected hymn.
 */
export async function saveHymn(hymn: Hymn, replaces: number | null = null): Promise<SaveResult> {
  const gone = (h: Hymn) => h.number !== hymn.number && h.number !== replaces;
  if (state !== 'local') {
    try {
      await post({ action: 'save', hymn, ...(replaces !== null && { replaces }) });
      setShared([...shared.filter(gone), hymn]);
      setLocal(readList(LOCAL_KEY).filter(gone));
      emit();
      return 'shared';
    } catch (err) {
      if (!(err instanceof HymnStoreError && FALLBACK_CODES.has(err.code))) {
        emit();
        throw err;
      }
    }
  }
  setLocal([...readList(LOCAL_KEY).filter(gone), hymn]);
  emit();
  return getSyncStatus().state === 'local' ? 'local' : 'fallback';
}

/** Delete a hymn everywhere it is saved. A shared hymn needs a connection to delete. */
export async function deleteHymn(hymnNumber: number): Promise<void> {
  if (shared.some((h) => h.number === hymnNumber)) {
    try {
      await post({ action: 'delete', number: hymnNumber });
    } finally {
      emit();
    }
    setShared(shared.filter((h) => h.number !== hymnNumber));
  }
  setLocal(readList(LOCAL_KEY).filter((h) => h.number !== hymnNumber));
  emit();
}

async function uploadAll(hymns: Hymn[]): Promise<void> {
  for (let i = 0; i < hymns.length; i += IMPORT_BATCH) {
    await post({ action: 'import', hymns: hymns.slice(i, i + IMPORT_BATCH) });
    setShared(mergeInto(shared, hymns.slice(i, i + IMPORT_BATCH)));
  }
}

/** Send this computer's unshared hymns to every device. Returns how many were sent. */
export async function shareLocalHymns(): Promise<number> {
  const local = readList(LOCAL_KEY);
  if (local.length === 0) return 0;
  try {
    await uploadAll(local);
    setLocal([]);
  } finally {
    emit();
  }
  return local.length;
}

/** Everything added or changed, as a file the operator can keep. */
export function exportHymns(): string {
  return JSON.stringify({ app: 'sanctum', kind: 'hymns', version: 1, hymns: getCustomHymns() }, null, 2);
}

/**
 * Restore hymns from a backup file, merging with what is saved; a hymn in the
 * file replaces one with the same number. Returns how many were read and where they went.
 */
export async function importHymns(fileText: string): Promise<{ count: number; where: SaveResult }> {
  const data: unknown = JSON.parse(fileText);
  const list = Array.isArray(data) ? data : (data as { hymns?: unknown })?.hymns;
  if (!Array.isArray(list)) throw new HymnStoreError('invalid', 'This file is not a Sanctum hymn backup.');
  const incoming = list.filter(isHymnLike);
  if (incoming.length === 0) throw new HymnStoreError('invalid', 'No hymns were found in this file.');

  if (state !== 'local') {
    try {
      await uploadAll(incoming);
      emit();
      return { count: incoming.length, where: 'shared' };
    } catch (err) {
      if (!(err instanceof HymnStoreError && FALLBACK_CODES.has(err.code))) {
        emit();
        throw err;
      }
    }
  }
  setLocal(mergeInto(readList(LOCAL_KEY), incoming));
  emit();
  return { count: incoming.length, where: getSyncStatus().state === 'local' ? 'local' : 'fallback' };
}
