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
