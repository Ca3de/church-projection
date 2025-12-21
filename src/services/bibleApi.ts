import type { Verse, ScriptureReference } from '../types/bible';
import { BIBLE_BOOKS } from '../types/bible';

const API_BASE = 'https://bible-api.com';
const TRANSLATION = 'kjv';

interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export function parseScriptureReference(input: string): ScriptureReference | null {
  // Clean up input
  const cleaned = input.trim();

  // Pattern: "Book Chapter:Verse" or "Book Chapter:StartVerse-EndVerse"
  // Examples: "John 3:16", "Psalm 23:1-6", "1 Corinthians 13:4-8"
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

export async function fetchVerses(reference: ScriptureReference): Promise<Verse[]> {
  const verseRange = reference.verseEnd
    ? `${reference.verseStart}-${reference.verseEnd}`
    : `${reference.verseStart}`;

  const query = `${reference.book} ${reference.chapter}:${verseRange}`;

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}?translation=${TRANSLATION}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch scripture: ${response.statusText}`);
    }

    const data: BibleApiResponse = await response.json();

    return data.verses.map(v => ({
      book: reference.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text.trim(),
    }));
  } catch (error) {
    console.error('Error fetching verses:', error);
    throw error;
  }
}

export async function fetchNextVerse(currentVerse: Verse): Promise<Verse | null> {
  const nextVerseNum = currentVerse.verse + 1;
  const query = `${currentVerse.book} ${currentVerse.chapter}:${nextVerseNum}`;

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}?translation=${TRANSLATION}`);

    if (!response.ok) {
      // Try next chapter
      return fetchFirstVerseOfChapter(currentVerse.book, currentVerse.chapter + 1);
    }

    const data: BibleApiResponse = await response.json();

    if (data.verses.length === 0) {
      return fetchFirstVerseOfChapter(currentVerse.book, currentVerse.chapter + 1);
    }

    return {
      book: currentVerse.book,
      chapter: data.verses[0].chapter,
      verse: data.verses[0].verse,
      text: data.verses[0].text.trim(),
    };
  } catch {
    return null;
  }
}

export async function fetchPreviousVerse(currentVerse: Verse): Promise<Verse | null> {
  if (currentVerse.verse > 1) {
    const prevVerseNum = currentVerse.verse - 1;
    const query = `${currentVerse.book} ${currentVerse.chapter}:${prevVerseNum}`;

    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}?translation=${TRANSLATION}`);

      if (!response.ok) {
        return null;
      }

      const data: BibleApiResponse = await response.json();

      if (data.verses.length === 0) {
        return null;
      }

      return {
        book: currentVerse.book,
        chapter: data.verses[0].chapter,
        verse: data.verses[0].verse,
        text: data.verses[0].text.trim(),
      };
    } catch {
      return null;
    }
  } else if (currentVerse.chapter > 1) {
    // Try last verse of previous chapter
    return fetchLastVerseOfChapter(currentVerse.book, currentVerse.chapter - 1);
  }

  return null;
}

async function fetchFirstVerseOfChapter(book: string, chapter: number): Promise<Verse | null> {
  const query = `${book} ${chapter}:1`;

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}?translation=${TRANSLATION}`);

    if (!response.ok) {
      return null;
    }

    const data: BibleApiResponse = await response.json();

    if (data.verses.length === 0) {
      return null;
    }

    return {
      book,
      chapter: data.verses[0].chapter,
      verse: data.verses[0].verse,
      text: data.verses[0].text.trim(),
    };
  } catch {
    return null;
  }
}

async function fetchLastVerseOfChapter(book: string, chapter: number): Promise<Verse | null> {
  // Fetch the whole chapter and get the last verse
  const query = `${book} ${chapter}`;

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}?translation=${TRANSLATION}`);

    if (!response.ok) {
      return null;
    }

    const data: BibleApiResponse = await response.json();

    if (data.verses.length === 0) {
      return null;
    }

    const lastVerse = data.verses[data.verses.length - 1];

    return {
      book,
      chapter: lastVerse.chapter,
      verse: lastVerse.verse,
      text: lastVerse.text.trim(),
    };
  } catch {
    return null;
  }
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
