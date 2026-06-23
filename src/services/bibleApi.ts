import type { Verse, ScriptureReference } from '../types/bible';
import { BIBLE_BOOKS, DEFAULT_BIBLE_VERSION } from '../types/bible';

const API_ROOT = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

function apiBase(versionId: string): string {
  return `${API_ROOT}/${versionId}/books`;
}

// Map book names to API format (lowercase, no spaces)
function bookToApiFormat(bookName: string): string {
  return bookName
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces: "1 Corinthians" -> "1corinthians"
    .replace(/^(\d)/, '$1') // Keep numbers: "1corinthians"
    .replace(/song of solomon/i, 'songofsolomon')
    .replace(/psalm$/i, 'psalms'); // API uses "psalms" not "psalm"
}

interface VerseResponse {
  verse: string;
  text: string;
}

// Clean up KJV margin notes and annotations from verse text
function cleanVerseText(text: string): string {
  let cleaned = text;

  // Remove end-of-verse footnotes like ".5 forces: or, wealth" or "5 word: or, meaning"
  // Pattern: optional period, number, word, colon, then explanation
  cleaned = cleaned.replace(/\.?\d+\s+\w+:\s*(or,?\s*)?[^.]*$/gi, '');

  // Remove margin note patterns like "94.1 God…: Heb. God of revenges"
  cleaned = cleaned.replace(/\d+\.\d+\s+[^:]+:\s*Heb\.[^"]*/g, '');

  // Remove patterns like "1.1 word: meaning" (margin references)
  cleaned = cleaned.replace(/\d+\.\d+\s+\w+[….]?:\s*[^.]+\./g, '');

  // Remove standalone margin references like "94.1"
  cleaned = cleaned.replace(/\b\d+\.\d+\b/g, '');

  // Remove "Heb." annotations that might remain
  cleaned = cleaned.replace(/Heb\.\s*[^.]+/g, '');

  // Remove footnote patterns like "word…: explanation" or "word...: explanation"
  cleaned = cleaned.replace(/\w+[….]+:\s*[^.;!?]+[.;]?/g, '');

  // Remove any remaining patterns with ellipsis followed by colon
  cleaned = cleaned.replace(/[….]+:\s*[^.;!?]+/g, '');

  // Remove all quotation marks (single and double quotes)
  cleaned = cleaned.replace(/['"'""`]/g, '');

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function parseScriptureReference(input: string): ScriptureReference | null {
  const cleaned = input.trim();

  // Pattern: "Book Chapter:Verse" or "Book Chapter:StartVerse-EndVerse"
  const pattern = /^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/i;
  const match = cleaned.match(pattern);

  if (!match) {
    return null;
  }

  const [, bookName, chapter, verseStart, verseEnd] = match;

  // Find the book
  const normalizedBookName = bookName.toLowerCase().replace(/\s+/g, ' ').trim();
  const book = BIBLE_BOOKS.find(b =>
    b.name.toLowerCase() === normalizedBookName ||
    b.abbrev.toLowerCase() === normalizedBookName ||
    b.name.toLowerCase().startsWith(normalizedBookName)
  );

  if (!book) {
    return null;
  }

  return {
    book: book.name,
    chapter: parseInt(chapter, 10),
    verseStart: parseInt(verseStart, 10),
    verseEnd: verseEnd ? parseInt(verseEnd, 10) : undefined,
  };
}

// Fetch a single verse from the fast CDN
async function fetchSingleVerseRaw(
  book: string,
  chapter: number,
  verse: number,
  versionId: string
): Promise<Verse | null> {
  const apiBook = bookToApiFormat(book);
  const url = `${apiBase(versionId)}/${apiBook}/chapters/${chapter}/verses/${verse}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data: VerseResponse = await response.json();
    return {
      book,
      chapter,
      verse,
      text: cleanVerseText(data.text),
    };
  } catch {
    return null;
  }
}

// Local hosted-book JSON: /bibles/{version}/{book}.json
// Shape: { "1": { "1": "verse text", "2": "..." }, "2": {...} }
type BookData = Record<string, Record<string, string>>;

const bookCache = new Map<string, BookData | null>();
const bookInflight = new Map<string, Promise<BookData | null>>();
// Per-verse fallback cache for translations/books not in local store.
const verseCache = new Map<string, Verse | null>();

function bookKey(versionId: string, book: string): string {
  return `${versionId}|${book.toLowerCase()}`;
}

async function fetchLocalBook(versionId: string, book: string): Promise<BookData | null> {
  const k = bookKey(versionId, book);
  if (bookCache.has(k)) return bookCache.get(k)!;
  const inflight = bookInflight.get(k);
  if (inflight) return inflight;

  const promise = (async () => {
    const slug = bookToApiFormat(book);
    try {
      const r = await fetch(`/bibles/${versionId}/${slug}.json`);
      if (!r.ok) {
        bookCache.set(k, null);
        return null;
      }
      const data = (await r.json()) as BookData;
      bookCache.set(k, data);
      return data;
    } catch {
      bookCache.set(k, null);
      return null;
    } finally {
      bookInflight.delete(k);
    }
  })();

  bookInflight.set(k, promise);
  return promise;
}

function verseFromBookData(
  book: string,
  chapter: number,
  verse: number,
  data: BookData
): Verse | null {
  const text = data[String(chapter)]?.[String(verse)];
  if (typeof text !== 'string') return null;
  return { book, chapter, verse, text: cleanVerseText(text) };
}

function lastVerseFromBookData(
  book: string,
  chapter: number,
  data: BookData
): Verse | null {
  const ch = data[String(chapter)];
  if (!ch) return null;
  const nums = Object.keys(ch)
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  const lastNum = Math.max(...nums);
  return verseFromBookData(book, chapter, lastNum, data);
}

// CDN fallback: same per-verse fetcher as before, with a small in-memory cache.
async function fetchVerseFallback(
  book: string,
  chapter: number,
  verse: number,
  versionId: string
): Promise<Verse | null> {
  const k = `${versionId}|${book.toLowerCase()}|${chapter}|${verse}`;
  if (verseCache.has(k)) return verseCache.get(k) ?? null;
  const result = await fetchSingleVerseRaw(book, chapter, verse, versionId);
  verseCache.set(k, result);
  return result;
}

export async function fetchSingleVerse(
  book: string,
  chapter: number,
  verse: number,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  const data = await fetchLocalBook(versionId, book);
  if (data) {
    return verseFromBookData(book, chapter, verse, data);
  }
  return fetchVerseFallback(book, chapter, verse, versionId);
}

export async function fetchVerses(
  reference: ScriptureReference,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse[]> {
  const endVerse = reference.verseEnd || reference.verseStart;
  const data = await fetchLocalBook(versionId, reference.book);

  const verses: Verse[] = [];
  if (data) {
    for (let v = reference.verseStart; v <= endVerse; v++) {
      const verse = verseFromBookData(reference.book, reference.chapter, v, data);
      if (verse) verses.push(verse);
    }
  } else {
    // CDN fallback: parallel per-verse fetches.
    const promises: Promise<Verse | null>[] = [];
    for (let v = reference.verseStart; v <= endVerse; v++) {
      promises.push(fetchVerseFallback(reference.book, reference.chapter, v, versionId));
    }
    const results = await Promise.all(promises);
    for (const r of results) if (r) verses.push(r);
  }

  if (verses.length === 0) {
    throw new Error('Scripture not found');
  }

  return verses;
}

export async function fetchNextVerse(
  currentVerse: Verse,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  const data = await fetchLocalBook(versionId, currentVerse.book);
  if (data) {
    const next = verseFromBookData(
      currentVerse.book,
      currentVerse.chapter,
      currentVerse.verse + 1,
      data
    );
    if (next) return next;
    return verseFromBookData(currentVerse.book, currentVerse.chapter + 1, 1, data);
  }

  // Fallback path.
  const nextVerse = await fetchVerseFallback(
    currentVerse.book,
    currentVerse.chapter,
    currentVerse.verse + 1,
    versionId
  );
  if (nextVerse) return nextVerse;
  return fetchVerseFallback(currentVerse.book, currentVerse.chapter + 1, 1, versionId);
}

export async function fetchPreviousVerse(
  currentVerse: Verse,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  const data = await fetchLocalBook(versionId, currentVerse.book);
  if (data) {
    if (currentVerse.verse > 1) {
      return verseFromBookData(
        currentVerse.book,
        currentVerse.chapter,
        currentVerse.verse - 1,
        data
      );
    }
    if (currentVerse.chapter > 1) {
      return lastVerseFromBookData(currentVerse.book, currentVerse.chapter - 1, data);
    }
    return null;
  }

  // Fallback: per-verse from CDN.
  if (currentVerse.verse > 1) {
    return fetchVerseFallback(
      currentVerse.book,
      currentVerse.chapter,
      currentVerse.verse - 1,
      versionId
    );
  }
  if (currentVerse.chapter > 1) {
    // Probe in parallel to find the last verse of the previous chapter.
    const promises: Promise<Verse | null>[] = [];
    for (let v = 1; v <= 200; v++) {
      promises.push(
        fetchVerseFallback(currentVerse.book, currentVerse.chapter - 1, v, versionId)
      );
    }
    const results = await Promise.all(promises);
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i]) return results[i];
    }
  }
  return null;
}

export function formatReference(verse: Verse): string {
  return `${verse.book} ${verse.chapter}:${verse.verse}`;
}

export function formatRangeReference(verses: Verse[]): string {
  if (verses.length === 0) return '';
  if (verses.length === 1) return formatReference(verses[0]);

  const first = verses[0];
  const last = verses[verses.length - 1];

  if (first.chapter === last.chapter) {
    return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
  }

  return `${first.book} ${first.chapter}:${first.verse} - ${last.chapter}:${last.verse}`;
}
