import { HYMNS } from '../data/hymns';
import type { Hymn, HymnDisplayItem, HymnSearchResult } from '../types/hymn';

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

  const allHymns = getAllHymnsInternal();
  const results = allHymns.filter((hymn) => {
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
  const allHymns = getAllHymnsInternal();
  if (typeof numberOrId === 'string') {
    // Check if it's a YS identifier
    const upper = numberOrId.toUpperCase();
    if (upper.startsWith('YS')) {
      return allHymns.find((h) => h.displayNumber?.toUpperCase() === upper) || null;
    }
    // Try parsing as number
    const num = parseInt(numberOrId, 10);
    if (!isNaN(num)) {
      return allHymns.find((h) => h.number === num) || null;
    }
    return null;
  }
  return allHymns.find((h) => h.number === numberOrId) || null;
}

/**
 * Get all hymns (built-in + custom).
 */
export function getAllHymns(): Hymn[] {
  return getAllHymnsInternal();
}
