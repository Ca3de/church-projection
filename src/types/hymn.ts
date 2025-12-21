export interface Hymn {
  number: number;
  displayNumber?: string; // Original identifier like "YS1" for special hymns
  title: string;
  author?: string;
  year?: number;
  tune?: string;
  verses: string[];
  refrain?: string | null;
}

export interface HymnDisplayItem {
  hymnNumber: number;
  hymnDisplayNumber?: string; // Original identifier like "YS1"
  hymnTitle: string;
  text: string;
  type: 'verse' | 'refrain';
  verseNumber?: number;
  totalVerses: number;
  hasRefrain: boolean;
}

export interface HymnSearchResult {
  number: number;
  displayNumber?: string;
  title: string;
  author?: string;
}
