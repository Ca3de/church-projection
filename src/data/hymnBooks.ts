import type { HymnBookId } from '../types/hymn';

export interface HymnBook {
  id: HymnBookId;
  /** Full name, shown in the book selector */
  name: string;
  /** Printed before the number, e.g. "IOM 15". The main hymnal has none. */
  prefix?: string;
  /**
   * Added to the book's own number to make a unique internal id.
   * Reserved ranges: main < 8000, auto-numbered 8001+, YS 9000+,
   * IOM 20000+, A & M 30000+. Custom hymns use Date.now(), far above all.
   */
  offset: number;
  /** Spellings an operator might type before the number, pre-normalised */
  aliases: string[];
}

export const HYMN_BOOKS: HymnBook[] = [
  { id: 'main', name: 'Hymnal', offset: 0, aliases: [] },
  { id: 'iom', name: 'Iwe Orin Mimo', prefix: 'IOM', offset: 20000, aliases: ['iom'] },
  { id: 'am', name: 'A & M', prefix: 'A & M', offset: 30000, aliases: ['am', 'aandm'] },
];

export function getHymnBook(id: HymnBookId | undefined): HymnBook {
  return HYMN_BOOKS.find((b) => b.id === id) ?? HYMN_BOOKS[0];
}

/** Map a JSON "book" value ("IOM", "A & M", "A&M") to its id. */
export function resolveHymnBookId(value: string | undefined): HymnBookId {
  if (!value) return 'main';
  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  const book = HYMN_BOOKS.find((b) => b.aliases.includes(key));
  return book?.id ?? 'main';
}

/**
 * The internal id and printed label for a number typed into a book:
 * "788" → 788, "YS3" → 9003 / "YS3", "15" in IOM → 20015 / "IOM 15".
 * Returns null for a blank or unusable value.
 */
export function hymnIdentity(bookId: HymnBookId, raw: string): { number: number; displayNumber?: string } | null {
  const value = raw.trim();
  if (!value) return null;
  const book = getHymnBook(bookId);
  if (book.id === 'main') {
    const ys = value.match(/^ys\s*(\d{1,3})$/i);
    if (ys) return { number: 9000 + parseInt(ys[1], 10), displayNumber: `YS${parseInt(ys[1], 10)}` };
  }
  if (!/^\d{1,4}$/.test(value)) return null;
  const n = parseInt(value, 10);
  // The main hymnal stays below the auto-numbered (8001+) and YS (9000+) ranges
  if (n < 1 || (book.id === 'main' && n >= 8000)) return null;
  return book.id === 'main' ? { number: n } : { number: book.offset + n, displayNumber: `${book.prefix} ${n}` };
}

/** The number as printed in its hymnbook: 15 for IOM 15, "YS3", or "" when unnumbered. */
export function printedNumber(hymn: { number: number; displayNumber?: string; book?: HymnBookId; unnumbered?: boolean }): string {
  if (hymn.unnumbered) return '';
  const book = getHymnBook(hymn.book);
  if (book.id !== 'main') return String(hymn.number - book.offset);
  return hymn.displayNumber ?? String(hymn.number);
}
