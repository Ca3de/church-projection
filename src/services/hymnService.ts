import { HYMNS } from '../data/hymns';
import { HYMN_BOOKS, getHymnBook } from '../data/hymnBooks';
import type { Hymn, HymnBookId, HymnDisplayItem, HymnSearchResult } from '../types/hymn';

// Custom hymns stored in localStorage
const CUSTOM_HYMNS_KEY = 'church-projection-custom-hymns';

function getCustomHymns(): Hymn[] {
  try {
    const stored = localStorage.getItem(CUSTOM_HYMNS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveCustomHymns(hymns: Hymn[]): void {
  localStorage.setItem(CUSTOM_HYMNS_KEY, JSON.stringify(hymns));
}

// Get all hymns (built-in + custom)
function getAllHymnsInternal(): Hymn[] {
  const custom = getCustomHymns();
  // Merge: custom hymns override built-in with same number
  const builtInFiltered = HYMNS.filter(h => !custom.some(c => c.number === h.number));
  return [...builtInFiltered, ...custom].sort((a, b) => a.number - b.number);
}

// Add a custom hymn
export function addCustomHymn(hymn: Hymn): void {
  const custom = getCustomHymns();
  // Remove existing with same number if any
  const filtered = custom.filter(h => h.number !== hymn.number);
  filtered.push(hymn);
  saveCustomHymns(filtered);
}

// Delete a custom hymn
export function deleteCustomHymn(hymnNumber: number): boolean {
  const custom = getCustomHymns();
  const filtered = custom.filter(h => h.number !== hymnNumber);
  if (filtered.length !== custom.length) {
    saveCustomHymns(filtered);
    return true;
  }
  return false;
}

// Check if a hymn is custom
export function isCustomHymn(hymnNumber: number): boolean {
  return getCustomHymns().some(h => h.number === hymnNumber);
}

// Parse hymn from text format
export function parseHymnText(text: string): Hymn | null {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;

  const verses: string[] = [];
  let refrain: string | null = null;
  let currentVerseLines: string[] = [];
  let isRefrain = false;
  let title = '';
  let number = Date.now(); // Default unique number

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for verse number pattern (e.g., "1.", "2.", etc.)
    const verseMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (verseMatch) {
      // Save previous verse/refrain
      if (currentVerseLines.length > 0) {
        if (isRefrain) {
          refrain = currentVerseLines.join('\n');
        } else {
          verses.push(currentVerseLines.join('\n'));
        }
      }
      currentVerseLines = verseMatch[2] ? [verseMatch[2]] : [];
      isRefrain = false;
      continue;
    }

    // Check for refrain/chorus marker
    if (line.toLowerCase().match(/^(refrain|chorus):?\s*$/)) {
      // Save previous verse
      if (currentVerseLines.length > 0 && !isRefrain) {
        verses.push(currentVerseLines.join('\n'));
      }
      currentVerseLines = [];
      isRefrain = true;
      continue;
    }

    // Check for title with number (e.g., "523. Higher Ground" or "Hymn 523 - Higher Ground")
    const titleMatch = line.match(/^(?:hymn\s+)?(\d+)[\.\-\s]+(.+)$/i);
    if (titleMatch && i < 3 && verses.length === 0) {
      number = parseInt(titleMatch[1], 10);
      title = titleMatch[2].trim();
      continue;
    }

    // If first non-empty line and no title yet, treat as title
    if (!title && line && i < 2) {
      title = line;
      continue;
    }

    // Regular line - add to current verse/refrain
    if (line) {
      currentVerseLines.push(line);
    }
  }

  // Save last verse/refrain
  if (currentVerseLines.length > 0) {
    if (isRefrain) {
      refrain = currentVerseLines.join('\n');
    } else {
      verses.push(currentVerseLines.join('\n'));
    }
  }

  if (!title || verses.length === 0) {
    return null;
  }

  return {
    number,
    title,
    verses,
    refrain,
  };
}

// Export custom hymns list for management
export function getCustomHymnsList(): Hymn[] {
  return getCustomHymns();
}

/**
 * Calculate total display items for a hymn.
 * If the hymn has a refrain, each verse is followed by the refrain.
 * Pattern: verse 1 -> refrain -> verse 2 -> refrain -> verse 3 -> refrain...
 */
export function getTotalDisplayItems(hymn: Hymn): number {
  const verseCount = hymn.verses.length;
  if (hymn.refrain) {
    return verseCount * 2; // verse + refrain for each
  }
  return verseCount;
}

/**
 * Get the display item at a specific index.
 * Handles the interleaving of verses and refrains.
 */
export function getDisplayItemAtIndex(
  hymn: Hymn,
  index: number
): HymnDisplayItem | null {
  const totalItems = getTotalDisplayItems(hymn);
  if (index < 0 || index >= totalItems) return null;

  if (hymn.refrain) {
    // Interleaved pattern: verse, refrain, verse, refrain...
    const isRefrain = index % 2 === 1;
    const verseIndex = Math.floor(index / 2);

    return {
      hymnNumber: hymn.number,
      hymnDisplayNumber: hymn.displayNumber,
      hymnUnnumbered: hymn.unnumbered,
      hymnTitle: hymn.title,
      text: isRefrain ? hymn.refrain : hymn.verses[verseIndex],
      type: isRefrain ? 'refrain' : 'verse',
      verseNumber: isRefrain ? undefined : verseIndex + 1,
      totalVerses: hymn.verses.length,
      hasRefrain: true,
      ...secondaryFor(hymn, isRefrain ? hymn.secondaryRefrain : hymn.secondaryVerses?.[verseIndex]),
    };
  } else {
    // No refrain: just verses in sequence
    return {
      hymnNumber: hymn.number,
      hymnDisplayNumber: hymn.displayNumber,
      hymnUnnumbered: hymn.unnumbered,
      hymnTitle: hymn.title,
      text: hymn.verses[index],
      type: 'verse',
      verseNumber: index + 1,
      totalVerses: hymn.verses.length,
      hasRefrain: false,
      ...secondaryFor(hymn, hymn.secondaryVerses?.[index]),
    };
  }
}

// Parallel-text fields for a display item — omitted when this stanza has none
function secondaryFor(hymn: Hymn, text: string | null | undefined): Partial<HymnDisplayItem> {
  if (!text) return {};
  return {
    secondaryText: text,
    secondaryTitle: hymn.secondaryTitle,
    secondaryLanguage: hymn.secondaryLanguage,
  };
}

// ── Search & lookup ─────────────────────────────────────────────────

/** Lowercase and strip diacritics, so "sise" matches "Ṣiṣẹ" and "wa" matches "Wà". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Letters and digits only — "A & M 319", "a&m319" and "am 319" all become "am319". */
function compact(text: string): string {
  return fold(text).replace(/[^a-z0-9]/g, '');
}

function bookOf(hymn: Hymn): HymnBookId {
  return hymn.book ?? 'main';
}

/** The number printed in the hymnbook, e.g. 15 for IOM 15. */
function bookNumber(hymn: Hymn): number {
  return hymn.number - getHymnBook(bookOf(hymn)).offset;
}

/**
 * Detect an explicit book prefix: "IOM 15", "iom", "A & M 319", "am319".
 * A bare "am" only counts when followed by a number, so typing "amazing"
 * still searches titles.
 */
function parseBookPrefix(query: string): { book: HymnBookId; number?: number } | null {
  const q = compact(query);
  for (const book of HYMN_BOOKS) {
    for (const alias of book.aliases) {
      const match = q.match(new RegExp(`^${alias}(\\d*)$`));
      if (!match) continue;
      const digits = match[1];
      if (!digits && alias === 'am' && fold(query).trim() === 'am') continue;
      return { book: book.id, number: digits ? parseInt(digits, 10) : undefined };
    }
  }
  return null;
}

/** "821", "YS1", "IOM 15", "A & M 319" — or "" for a hymn with no number. */
export function formatHymnLabel(hymn: Pick<Hymn, 'number' | 'displayNumber' | 'unnumbered'>): string {
  if (hymn.unnumbered) return '';
  return hymn.displayNumber ?? String(hymn.number);
}

/** Label for a number that may not exist, used in "not found" messages. */
export function describeHymnQuery(query: string, activeBook: HymnBookId = 'main'): string {
  const explicit = parseBookPrefix(query);
  const book = getHymnBook(explicit?.book ?? activeBook);
  const number = explicit?.number ?? parseInt(query, 10);
  if (isNaN(number)) return `"${query.trim()}"`;
  return book.prefix ? `${book.prefix} ${number}` : `Hymn ${number}`;
}

/**
 * Resolve what the operator typed to a single hymn, if it names one exactly.
 * A bare number is read in the active book; a prefix ("IOM 15") overrides it.
 */
export function resolveHymn(query: string, activeBook: HymnBookId = 'main'): Hymn | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const all = getAllHymnsInternal();

  const explicit = parseBookPrefix(trimmed);
  if (explicit?.number !== undefined) {
    return all.find((h) => bookOf(h) === explicit.book && bookNumber(h) === explicit.number) ?? null;
  }

  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    return all.find((h) => !h.unnumbered && bookOf(h) === activeBook && bookNumber(h) === n) ?? null;
  }

  // Special identifiers such as "YS1"
  const key = compact(trimmed);
  return all.find((h) => h.displayNumber && compact(h.displayNumber) === key) ?? null;
}

/**
 * Search hymns by number, identifier (YS1, IOM 15), or title in either language.
 * Numbers are read in the active book; titles are searched across every book,
 * with the active book's matches listed first.
 */
export function searchHymns(query: string, activeBook: HymnBookId = 'main'): HymnSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const all = getAllHymnsInternal();
  const explicit = parseBookPrefix(trimmed);
  const isNumber = /^\d+$/.test(trimmed);
  // Titles are matched on letters and digits only, so commas, hyphens and
  // apostrophes never matter: "praise my soul" finds "Praise, My Soul, …"
  const needleKey = compact(trimmed);

  let results: Hymn[];
  if (explicit) {
    results = all.filter(
      (h) =>
        bookOf(h) === explicit.book &&
        (explicit.number === undefined || String(bookNumber(h)).startsWith(String(explicit.number)))
    );
  } else if (isNumber) {
    results = all.filter(
      (h) => !h.unnumbered && bookOf(h) === activeBook && String(bookNumber(h)).startsWith(trimmed)
    );
  } else {
    results = all.filter(
      (h) =>
        compact(h.title).includes(needleKey) ||
        (h.secondaryTitle && compact(h.secondaryTitle).includes(needleKey)) ||
        (h.displayNumber && compact(h.displayNumber).includes(needleKey))
    );
  }

  const exactNumber = explicit?.number ?? (isNumber ? parseInt(trimmed, 10) : undefined);
  results.sort((a, b) => {
    // An exact identifier match ("YS1", "IOM 15") first
    const aExact = a.displayNumber && compact(a.displayNumber) === needleKey;
    const bExact = b.displayNumber && compact(b.displayNumber) === needleKey;
    if (aExact !== bExact) return aExact ? -1 : 1;

    if (exactNumber !== undefined) {
      const aHit = bookNumber(a) === exactNumber;
      const bHit = bookNumber(b) === exactNumber;
      if (aHit !== bHit) return aHit ? -1 : 1;
    }

    // Title searches span every book; the active one leads
    const aHome = bookOf(a) === activeBook;
    const bHome = bookOf(b) === activeBook;
    if (aHome !== bHome) return aHome ? -1 : 1;

    return a.number - b.number;
  });

  return results.slice(0, 10).map((hymn) => ({
    number: hymn.number,
    displayNumber: hymn.displayNumber,
    title: hymn.title,
    author: hymn.author,
    book: bookOf(hymn),
    secondaryTitle: hymn.secondaryTitle,
    unnumbered: hymn.unnumbered,
  }));
}

/**
 * Get a hymn by its internal number, or by an identifier such as "YS1" or "IOM 15".
 */
export function getHymnByNumber(numberOrId: number | string): Hymn | null {
  if (typeof numberOrId === 'string') return resolveHymn(numberOrId);
  return getAllHymnsInternal().find((h) => h.number === numberOrId) || null;
}

/**
 * Get all hymns (built-in + custom).
 */
export function getAllHymns(): Hymn[] {
  return getAllHymnsInternal();
}
