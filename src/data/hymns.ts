import type { Hymn } from '../types/hymn';
import hymnsJson from './hymns-3.json';

// Interface for the new JSON format (hymns-3.json)
interface JsonVerse {
  verse: number;
  text: string;
}

interface JsonHymn {
  title: string;
  number: string;
  type: string;
  verses: JsonVerse[];
  refrain?: string;
}

// Convert JSON format to our Hymn format
function convertJsonHymn(jsonHymn: JsonHymn): Hymn | null {
  // Skip hymns with no verses
  if (!jsonHymn.verses || jsonHymn.verses.length === 0) {
    return null;
  }

  // Parse hymn number
  const hymnNumber = parseInt(jsonHymn.number, 10);
  if (isNaN(hymnNumber)) {
    return null;
  }

  // Extract verses in order (already numbered in the new format)
  const sortedVerses = [...jsonHymn.verses].sort((a, b) => a.verse - b.verse);
  const verses = sortedVerses.map((v) => v.text);

  return {
    number: hymnNumber,
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
