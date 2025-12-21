import type { Hymn } from '../types/hymn';
import hymnsJson from './hymns-3.json';

// Interface for the new JSON format (hymns-3.json)
interface JsonVerse {
  verse: number;
  text: string;
}

interface JsonHymn {
  title: string;
  number: string | null;
  type: string;
  verses: JsonVerse[];
  refrain?: string;
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

  const numStr = jsonHymn.number;

  if (numStr && numStr.toUpperCase().startsWith('YS')) {
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
  }

  // Extract verses in order (already numbered in the new format)
  const sortedVerses = [...jsonHymn.verses].sort((a, b) => a.verse - b.verse);
  const verses = sortedVerses.map((v) => v.text);

  return {
    number: hymnNumber,
    displayNumber,
    title: jsonHymn.title,
    verses,
    refrain: jsonHymn.refrain || null,
  };
}

// Convert all JSON hymns
const convertedHymns: Hymn[] = (hymnsJson.hymns as JsonHymn[])
  .map((h) => convertJsonHymn(h))
  .filter((h): h is Hymn => h !== null);

// Export sorted hymns
export const HYMNS: Hymn[] = convertedHymns.sort((a, b) => a.number - b.number);
