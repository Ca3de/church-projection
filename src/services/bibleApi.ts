import type { Verse, ScriptureReference } from '../types/bible';
import { BIBLE_BOOKS } from '../types/bible';

// Fast CDN-based KJV Bible API
const API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books';

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

  // Remove margin note patterns like "94.1 God…: Heb. God of revenges"
  // Pattern: verse reference followed by word and colon, then "Heb." annotation
  cleaned = cleaned.replace(/\d+\.\d+\s+[^:]+:\s*Heb\.[^"]*/g, '');

  // Remove patterns like "1.1 word: meaning" (margin references)
  cleaned = cleaned.replace(/\d+\.\d+\s+\w+[….]?:\s*[^.]+\./g, '');

  // Remove standalone margin references like "94.1"
  cleaned = cleaned.replace(/\b\d+\.\d+\b/g, '');

  // Remove "Heb." annotations that might remain
  cleaned = cleaned.replace(/Heb\.\s*[^.]+/g, '');

  // Remove "or," and "or:" margin alternatives
  cleaned = cleaned.replace(/\bor,?\s*[^.;]+[.;]/gi, '');

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
async function fetchSingleVerse(book: string, chapter: number, verse: number): Promise<Verse | null> {
  const apiBook = bookToApiFormat(book);
  const url = `${API_BASE}/${apiBook}/chapters/${chapter}/verses/${verse}.json`;

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

export async function fetchVerses(reference: ScriptureReference): Promise<Verse[]> {
  const verses: Verse[] = [];
  const endVerse = reference.verseEnd || reference.verseStart;

  // Fetch verses in parallel for speed
  const promises: Promise<Verse | null>[] = [];
  for (let v = reference.verseStart; v <= endVerse; v++) {
    promises.push(fetchSingleVerse(reference.book, reference.chapter, v));
  }

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result) {
      verses.push(result);
    }
  }

  if (verses.length === 0) {
    throw new Error('Scripture not found');
  }

  return verses;
}

export async function fetchNextVerse(currentVerse: Verse): Promise<Verse | null> {
  // Try next verse in same chapter
  const nextVerse = await fetchSingleVerse(
    currentVerse.book,
    currentVerse.chapter,
    currentVerse.verse + 1
  );

  if (nextVerse) {
    return nextVerse;
  }

  // Try first verse of next chapter
  return fetchSingleVerse(currentVerse.book, currentVerse.chapter + 1, 1);
}

export async function fetchPreviousVerse(currentVerse: Verse): Promise<Verse | null> {
  if (currentVerse.verse > 1) {
    // Try previous verse in same chapter
    return fetchSingleVerse(
      currentVerse.book,
      currentVerse.chapter,
      currentVerse.verse - 1
    );
  }

  if (currentVerse.chapter > 1) {
    // Try to find last verse of previous chapter by probing
    // Start high and work down (most chapters have < 180 verses)
    for (let v = 180; v >= 1; v--) {
      const verse = await fetchSingleVerse(
        currentVerse.book,
        currentVerse.chapter - 1,
        v
      );
      if (verse) {
        return verse;
      }
      // Quick binary search optimization: if 180 fails, try 80, then 50, etc.
      if (v === 180) v = 81;
      else if (v === 80) v = 51;
      else if (v === 50) v = 36;
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
