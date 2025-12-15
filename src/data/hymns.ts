import type { Hymn } from '../types/hymn';
import hymnsJson from './hymns.json';

// Interface for the JSON format
interface JsonVerse {
  verse_number: string;
  text: string;
}

interface JsonHymn {
  type: string;
  title: string;
  number: string | null;
  verses: JsonVerse[];
}

// Convert JSON format to our Hymn format
function convertJsonHymn(jsonHymn: JsonHymn, index: number): Hymn | null {
  // Skip hymns with no verses or invalid data
  if (!jsonHymn.verses || jsonHymn.verses.length === 0) {
    return null;
  }

  // Skip hymns with generic titles
  if (jsonHymn.title === 'Hymn' || jsonHymn.title === 'hymn' || jsonHymn.title === 'Hymn:') {
    return null;
  }

  // Parse hymn number - use index + 1000 for unnumbered hymns to avoid conflicts
  let hymnNumber: number;
  if (jsonHymn.number && jsonHymn.number !== 'null') {
    hymnNumber = parseInt(jsonHymn.number, 10);
    if (isNaN(hymnNumber)) {
      hymnNumber = 1000 + index;
    }
  } else {
    hymnNumber = 1000 + index;
  }

  // Extract verses and refrain
  const verses: string[] = [];
  let refrain: string | null = null;

  for (const verse of jsonHymn.verses) {
    const verseNum = verse.verse_number.toLowerCase().trim();

    if (verseNum === 'refrain') {
      // Take the first refrain we find (they're usually repeated)
      if (!refrain) {
        refrain = verse.text;
      }
    } else if (/^\d+$/.test(verseNum)) {
      // It's a numbered verse
      verses.push(verse.text);
    }
  }

  // Skip if no actual verses
  if (verses.length === 0) {
    return null;
  }

  return {
    number: hymnNumber,
    title: jsonHymn.title.replace(/\s*#\d+\s*$/, '').trim(), // Remove trailing hymn numbers
    verses,
    refrain,
  };
}

// Convert all JSON hymns
const convertedHymns: Hymn[] = (hymnsJson.hymns as JsonHymn[])
  .map((h, i) => convertJsonHymn(h, i))
  .filter((h): h is Hymn => h !== null);

// Original hardcoded hymns (keep as fallback/examples)
const originalHymns: Hymn[] = [
  {
    number: 1,
    title: 'Holy, Holy, Holy',
    author: 'Reginald Heber',
    year: 1826,
    tune: 'NICAEA',
    verses: [
      'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to thee;\nHoly, holy, holy! merciful and mighty,\nGod in three Persons, blessed Trinity!',
      'Holy, holy, holy! all the saints adore thee,\nCasting down their golden crowns around the glassy sea;\nCherubim and seraphim falling down before thee,\nWhich wert, and art, and evermore shalt be.',
      'Holy, holy, holy! though the darkness hide thee,\nThough the eye made blind by sin thy glory may not see,\nOnly thou art holy; there is none beside thee,\nPerfect in power, in love, and purity.',
      'Holy, holy, holy! Lord God Almighty!\nAll thy works shall praise thy name, in earth, and sky, and sea;\nHoly, holy, holy! merciful and mighty,\nGod in three Persons, blessed Trinity!',
    ],
    refrain: null,
  },
  {
    number: 100,
    title: 'To God Be the Glory',
    author: 'Fanny Crosby',
    year: 1875,
    tune: 'TO GOD BE THE GLORY',
    verses: [
      'To God be the glory, great things he hath done!\nSo loved he the world that he gave us his Son,\nWho yielded his life an atonement for sin,\nAnd opened the life-gate that all may go in.',
      'O perfect redemption, the purchase of blood,\nTo every believer the promise of God;\nThe vilest offender who truly believes,\nThat moment from Jesus a pardon receives.',
      'Great things he hath taught us, great things he hath done,\nAnd great our rejoicing through Jesus the Son;\nBut purer, and higher, and greater will be\nOur wonder, our transport, when Jesus we see.',
    ],
    refrain:
      'Praise the Lord, praise the Lord,\nLet the earth hear his voice!\nPraise the Lord, praise the Lord,\nLet the people rejoice!\nO come to the Father through Jesus the Son,\nAnd give him the glory, great things he hath done.',
  },
  {
    number: 234,
    title: 'Amazing Grace',
    author: 'John Newton',
    year: 1779,
    tune: 'NEW BRITAIN',
    verses: [
      "Amazing grace! how sweet the sound,\nThat saved a wretch like me!\nI once was lost, but now am found,\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!",
      "Through many dangers, toils, and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
      'The Lord has promised good to me,\nHis word my hope secures;\nHe will my shield and portion be\nAs long as life endures.',
      "When we've been there ten thousand years,\nBright shining as the sun,\nWe've no less days to sing God's praise\nThan when we'd first begun.",
    ],
    refrain: null,
  },
  {
    number: 370,
    title: 'Blessed Assurance',
    author: 'Fanny Crosby',
    year: 1873,
    tune: 'ASSURANCE',
    verses: [
      'Blessed assurance, Jesus is mine!\nOh, what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of his Spirit, washed in his blood.',
      'Perfect submission, perfect delight,\nVisions of rapture now burst on my sight;\nAngels descending, bring from above\nEchoes of mercy, whispers of love.',
      'Perfect submission, all is at rest,\nI in my Savior am happy and blest;\nWatching and waiting, looking above,\nFilled with his goodness, lost in his love.',
    ],
    refrain:
      'This is my story, this is my song,\nPraising my Savior all the day long;\nThis is my story, this is my song,\nPraising my Savior all the day long.',
  },
];

// Merge hymns, preferring JSON hymns for duplicates (by number)
const hymnMap = new Map<number, Hymn>();

// Add original hymns first
for (const hymn of originalHymns) {
  hymnMap.set(hymn.number, hymn);
}

// Add/override with converted JSON hymns
for (const hymn of convertedHymns) {
  hymnMap.set(hymn.number, hymn);
}

// Export merged and sorted hymns
export const HYMNS: Hymn[] = Array.from(hymnMap.values()).sort(
  (a, b) => a.number - b.number
);
