import type { Hymn } from '../types/hymn';
import hymnsJson from './hymns-3.json';
import { getHymnBook, resolveHymnBookId } from './hymnBooks';

// Interface for the new JSON format (hymns-3.json)
interface JsonVerse {
  verse: number;
  text: string;
  secondaryText?: string; // Parallel translation, e.g. Yoruba in Iwe Orin Mimo
}

interface JsonHymn {
  title: string;
  number: string | null;
  type: string;
  verses: JsonVerse[];
  refrain?: string;
  expiresAt?: string; // ISO date string (YYYY-MM-DD) — hymn hidden after this date
  book?: string; // "IOM", "A & M" — omitted for the main hymnal
  secondaryLanguage?: string;
  secondaryTitle?: string;
  secondaryRefrain?: string;
}

// Counter for auto-assigning numbers to hymns without valid numbers
let autoNumberCounter = 8001;

// Convert JSON format to our Hymn format
function convertJsonHymn(jsonHymn: JsonHymn): Hymn | null {
  // Skip hymns with no verses
  if (!jsonHymn.verses || jsonHymn.verses.length === 0) {
    return null;
  }

  let hymnNumber: number;
  let displayNumber: string | undefined;
  let unnumbered = false;

  const numStr = jsonHymn.number;

  const book = getHymnBook(resolveHymnBookId(jsonHymn.book));
  const bookNumber = numStr ? parseInt(numStr, 10) : NaN;

  if (book.id !== 'main') {
    // Other hymnbooks live in their own number range so IOM 15 ≠ hymn 15
    if (isNaN(bookNumber)) return null;
    hymnNumber = book.offset + bookNumber;
    displayNumber = `${book.prefix} ${bookNumber}`;
  } else if (numStr && numStr.toUpperCase().startsWith('YS')) {
    // Special church hymns like YS1, YS2, etc.
    // Map to 9001, 9002, etc. for internal numbering
    const ysNum = parseInt(numStr.slice(2), 10);
    hymnNumber = 9000 + (isNaN(ysNum) ? autoNumberCounter++ - 8000 : ysNum);
    displayNumber = numStr.toUpperCase();
  } else if (numStr && !isNaN(parseInt(numStr, 10))) {
    // Regular numeric hymn
    hymnNumber = parseInt(numStr, 10);
  } else {
    // Hymns with null or invalid numbers - auto-assign
    hymnNumber = autoNumberCounter++;
    unnumbered = true;
  }

  // Extract verses in order (already numbered in the new format)
  const sortedVerses = [...jsonHymn.verses].sort((a, b) => a.verse - b.verse);
  const verses = sortedVerses.map((v) => v.text);
  const hasSecondary = sortedVerses.some((v) => v.secondaryText);

  return {
    number: hymnNumber,
    displayNumber,
    ...(unnumbered && { unnumbered }),
    book: book.id,
    title: jsonHymn.title,
    verses,
    refrain: jsonHymn.refrain || null,
    ...(hasSecondary && {
      secondaryLanguage: jsonHymn.secondaryLanguage,
      secondaryTitle: jsonHymn.secondaryTitle,
      secondaryVerses: sortedVerses.map((v) => v.secondaryText ?? ''),
      secondaryRefrain: jsonHymn.secondaryRefrain || null,
    }),
  };
}

// Filter out expired hymns, then convert
const today = new Date().toISOString().split('T')[0];
const convertedHymns: Hymn[] = (hymnsJson.hymns as JsonHymn[])
  .filter((h) => !h.expiresAt || h.expiresAt >= today)
  .map((h) => convertJsonHymn(h))
  .filter((h): h is Hymn => h !== null);

// Export sorted hymns
export const HYMNS: Hymn[] = convertedHymns.sort((a, b) => a.number - b.number);
