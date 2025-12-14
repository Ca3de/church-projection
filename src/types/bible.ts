export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
}

export interface BibleBook {
  name: string;
  abbrev: string;
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Genesis', abbrev: 'Gen', chapters: 50 },
  { name: 'Exodus', abbrev: 'Exod', chapters: 40 },
  { name: 'Leviticus', abbrev: 'Lev', chapters: 27 },
  { name: 'Numbers', abbrev: 'Num', chapters: 36 },
  { name: 'Deuteronomy', abbrev: 'Deut', chapters: 34 },
  { name: 'Joshua', abbrev: 'Josh', chapters: 24 },
  { name: 'Judges', abbrev: 'Judg', chapters: 21 },
  { name: 'Ruth', abbrev: 'Ruth', chapters: 4 },
  { name: '1 Samuel', abbrev: '1Sam', chapters: 31 },
  { name: '2 Samuel', abbrev: '2Sam', chapters: 24 },
  { name: '1 Kings', abbrev: '1Kgs', chapters: 22 },
  { name: '2 Kings', abbrev: '2Kgs', chapters: 25 },
  { name: '1 Chronicles', abbrev: '1Chr', chapters: 29 },
  { name: '2 Chronicles', abbrev: '2Chr', chapters: 36 },
  { name: 'Ezra', abbrev: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', abbrev: 'Neh', chapters: 13 },
  { name: 'Esther', abbrev: 'Esth', chapters: 10 },
  { name: 'Job', abbrev: 'Job', chapters: 42 },
  { name: 'Psalms', abbrev: 'Ps', chapters: 150 },
  { name: 'Proverbs', abbrev: 'Prov', chapters: 31 },
  { name: 'Ecclesiastes', abbrev: 'Eccl', chapters: 12 },
  { name: 'Song of Solomon', abbrev: 'Song', chapters: 8 },
  { name: 'Isaiah', abbrev: 'Isa', chapters: 66 },
  { name: 'Jeremiah', abbrev: 'Jer', chapters: 52 },
  { name: 'Lamentations', abbrev: 'Lam', chapters: 5 },
  { name: 'Ezekiel', abbrev: 'Ezek', chapters: 48 },
  { name: 'Daniel', abbrev: 'Dan', chapters: 12 },
  { name: 'Hosea', abbrev: 'Hos', chapters: 14 },
  { name: 'Joel', abbrev: 'Joel', chapters: 3 },
  { name: 'Amos', abbrev: 'Amos', chapters: 9 },
  { name: 'Obadiah', abbrev: 'Obad', chapters: 1 },
  { name: 'Jonah', abbrev: 'Jonah', chapters: 4 },
  { name: 'Micah', abbrev: 'Mic', chapters: 7 },
  { name: 'Nahum', abbrev: 'Nah', chapters: 3 },
  { name: 'Habakkuk', abbrev: 'Hab', chapters: 3 },
  { name: 'Zephaniah', abbrev: 'Zeph', chapters: 3 },
  { name: 'Haggai', abbrev: 'Hag', chapters: 2 },
  { name: 'Zechariah', abbrev: 'Zech', chapters: 14 },
  { name: 'Malachi', abbrev: 'Mal', chapters: 4 },
  { name: 'Matthew', abbrev: 'Matt', chapters: 28 },
  { name: 'Mark', abbrev: 'Mark', chapters: 16 },
  { name: 'Luke', abbrev: 'Luke', chapters: 24 },
  { name: 'John', abbrev: 'John', chapters: 21 },
  { name: 'Acts', abbrev: 'Acts', chapters: 28 },
  { name: 'Romans', abbrev: 'Rom', chapters: 16 },
  { name: '1 Corinthians', abbrev: '1Cor', chapters: 16 },
  { name: '2 Corinthians', abbrev: '2Cor', chapters: 13 },
  { name: 'Galatians', abbrev: 'Gal', chapters: 6 },
  { name: 'Ephesians', abbrev: 'Eph', chapters: 6 },
  { name: 'Philippians', abbrev: 'Phil', chapters: 4 },
  { name: 'Colossians', abbrev: 'Col', chapters: 4 },
  { name: '1 Thessalonians', abbrev: '1Thess', chapters: 5 },
  { name: '2 Thessalonians', abbrev: '2Thess', chapters: 3 },
  { name: '1 Timothy', abbrev: '1Tim', chapters: 6 },
  { name: '2 Timothy', abbrev: '2Tim', chapters: 4 },
  { name: 'Titus', abbrev: 'Titus', chapters: 3 },
  { name: 'Philemon', abbrev: 'Phlm', chapters: 1 },
  { name: 'Hebrews', abbrev: 'Heb', chapters: 13 },
  { name: 'James', abbrev: 'Jas', chapters: 5 },
  { name: '1 Peter', abbrev: '1Pet', chapters: 5 },
  { name: '2 Peter', abbrev: '2Pet', chapters: 3 },
  { name: '1 John', abbrev: '1John', chapters: 5 },
  { name: '2 John', abbrev: '2John', chapters: 1 },
  { name: '3 John', abbrev: '3John', chapters: 1 },
  { name: 'Jude', abbrev: 'Jude', chapters: 1 },
  { name: 'Revelation', abbrev: 'Rev', chapters: 22 },
];
