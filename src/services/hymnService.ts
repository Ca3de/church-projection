import { HYMNS } from '../data/hymns';
import type { Hymn, HymnDisplayItem, HymnSearchResult } from '../types/hymn';

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
      hymnTitle: hymn.title,
      text: isRefrain ? hymn.refrain : hymn.verses[verseIndex],
      type: isRefrain ? 'refrain' : 'verse',
      verseNumber: isRefrain ? undefined : verseIndex + 1,
      totalVerses: hymn.verses.length,
      hasRefrain: true,
    };
  } else {
    // No refrain: just verses in sequence
    return {
      hymnNumber: hymn.number,
      hymnDisplayNumber: hymn.displayNumber,
      hymnTitle: hymn.title,
      text: hymn.verses[index],
      type: 'verse',
      verseNumber: index + 1,
      totalVerses: hymn.verses.length,
      hasRefrain: false,
    };
  }
}

/**
 * Search hymns by number, special identifier (YS1), or title.
 * Returns matching hymns, prioritizing exact matches.
 */
export function searchHymns(query: string): HymnSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  // Check if it's a number search
  const numberQuery = parseInt(normalizedQuery, 10);

  // Check if it's a YS search
  const isYsSearch = normalizedQuery.toUpperCase().startsWith('YS');

  const results = HYMNS.filter((hymn) => {
    // Match by displayNumber (e.g., "YS1")
    if (hymn.displayNumber) {
      if (hymn.displayNumber.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
    }

    // Match by number (exact or prefix)
    if (!isNaN(numberQuery)) {
      if (hymn.number.toString().startsWith(normalizedQuery)) {
        return true;
      }
    }

    // Match by title (contains)
    return hymn.title.toLowerCase().includes(normalizedQuery);
  });

  // Sort: exact matches first, then by hymn number
  results.sort((a, b) => {
    // Exact displayNumber match comes first
    if (isYsSearch && a.displayNumber?.toLowerCase() === normalizedQuery) return -1;
    if (isYsSearch && b.displayNumber?.toLowerCase() === normalizedQuery) return 1;

    // Exact number match comes next
    if (!isNaN(numberQuery)) {
      if (a.number === numberQuery) return -1;
      if (b.number === numberQuery) return 1;
    }

    // Then sort by hymn number
    return a.number - b.number;
  });

  return results.slice(0, 10).map((hymn) => ({
    number: hymn.number,
    displayNumber: hymn.displayNumber,
    title: hymn.title,
    author: hymn.author,
  }));
}

/**
 * Get a hymn by its number or displayNumber.
 */
export function getHymnByNumber(numberOrId: number | string): Hymn | null {
  if (typeof numberOrId === 'string') {
    // Check if it's a YS identifier
    const upper = numberOrId.toUpperCase();
    if (upper.startsWith('YS')) {
      return HYMNS.find((h) => h.displayNumber?.toUpperCase() === upper) || null;
    }
    // Try parsing as number
    const num = parseInt(numberOrId, 10);
    if (!isNaN(num)) {
      return HYMNS.find((h) => h.number === num) || null;
    }
    return null;
  }
  return HYMNS.find((h) => h.number === numberOrId) || null;
}

/**
 * Get all hymns (for debugging or listing).
 */
export function getAllHymns(): Hymn[] {
  return HYMNS;
}
