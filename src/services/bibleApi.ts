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

// In-memory caches keyed by version|book|chapter
const verseCache = new Map<string, Verse | null>();
const chapterCache = new Map<string, Verse[]>();
const chapterInflight = new Map<string, Promise<Verse[]>>();

function verseKey(versionId: string, book: string, chapter: number, verse: number): string {
  return `${versionId}|${book.toLowerCase()}|${chapter}|${verse}`;
}

function chapterKey(versionId: string, book: string, chapter: number): string {
  return `${versionId}|${book.toLowerCase()}|${chapter}`;
}

async function fetchVerseCached(
  book: string,
  chapter: number,
  verse: number,
  versionId: string
): Promise<Verse | null> {
  const k = verseKey(versionId, book, chapter, verse);
  if (verseCache.has(k)) return verseCache.get(k) ?? null;
  const result = await fetchSingleVerseRaw(book, chapter, verse, versionId);
  verseCache.set(k, result);
  return result;
}

// Fetch all verses in a chapter by probing in parallel chunks.
// Stops as soon as a full chunk returns no verses (chapter ended).
async function fetchChapterCached(
  book: string,
  chapter: number,
  versionId: string
): Promise<Verse[]> {
  const ck = chapterKey(versionId, book, chapter);
  const cached = chapterCache.get(ck);
  if (cached) return cached;
  const inflight = chapterInflight.get(ck);
  if (inflight) return inflight;

  const promise = (async () => {
    const verses: Verse[] = [];
    const CHUNK = 50;
    const MAX_CHUNKS = 4; // 200 verses covers every chapter (Psalm 119 = 176)
    for (let chunk = 0; chunk < MAX_CHUNKS; chunk++) {
      const start = chunk * CHUNK + 1;
      const promises: Promise<Verse | null>[] = [];
      for (let v = start; v < start + CHUNK; v++) {
        promises.push(fetchVerseCached(book, chapter, v, versionId));
      }
      const results = await Promise.all(promises);
      let chunkHadAny = false;
      for (const r of results) {
        if (r) {
          verses.push(r);
          chunkHadAny = true;
        }
      }
      if (!chunkHadAny) break;
    }
    chapterCache.set(ck, verses);
    chapterInflight.delete(ck);
    return verses;
  })();

  chapterInflight.set(ck, promise);
  return promise;
}

function prefetchChapter(book: string, chapter: number, versionId: string): void {
  fetchChapterCached(book, chapter, versionId).catch(() => {});
}

export async function fetchSingleVerse(
  book: string,
  chapter: number,
  verse: number,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  const result = await fetchVerseCached(book, chapter, verse, versionId);
  // Opportunistic background prefetch so subsequent nav is instant.
  prefetchChapter(book, chapter, versionId);
  return result;
}

export async function fetchVerses(
  reference: ScriptureReference,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse[]> {
  const endVerse = reference.verseEnd || reference.verseStart;

  // Fast path: fetch only the requested verses in parallel for snappy first display.
  const promises: Promise<Verse | null>[] = [];
  for (let v = reference.verseStart; v <= endVerse; v++) {
    promises.push(fetchVerseCached(reference.book, reference.chapter, v, versionId));
  }
  const results = await Promise.all(promises);
  const verses: Verse[] = [];
  for (const result of results) {
    if (result) verses.push(result);
  }

  if (verses.length === 0) {
    throw new Error('Scripture not found');
  }

  // Background-prefetch the rest of the chapter so next/prev is instant.
  prefetchChapter(reference.book, reference.chapter, versionId);

  return verses;
}

export async function fetchNextVerse(
  currentVerse: Verse,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  const nextVerse = await fetchVerseCached(
    currentVerse.book,
    currentVerse.chapter,
    currentVerse.verse + 1,
    versionId
  );

  if (nextVerse) return nextVerse;

  // End of chapter — jump to verse 1 of next chapter and prefetch it.
  const firstOfNext = await fetchVerseCached(
    currentVerse.book,
    currentVerse.chapter + 1,
    1,
    versionId
  );
  if (firstOfNext) {
    prefetchChapter(currentVerse.book, currentVerse.chapter + 1, versionId);
  }
  return firstOfNext;
}

export async function fetchPreviousVerse(
  currentVerse: Verse,
  versionId: string = DEFAULT_BIBLE_VERSION
): Promise<Verse | null> {
  if (currentVerse.verse > 1) {
    return fetchVerseCached(
      currentVerse.book,
      currentVerse.chapter,
      currentVerse.verse - 1,
      versionId
    );
  }

  if (currentVerse.chapter > 1) {
    // Use the chapter cache so this is one chunked parallel fetch instead of ~36 serial probes.
    const prevChapterVerses = await fetchChapterCached(
      currentVerse.book,
      currentVerse.chapter - 1,
      versionId
    );
    return prevChapterVerses[prevChapterVerses.length - 1] || null;
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
