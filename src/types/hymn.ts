export interface Hymn {
  number: number;
  title: string;
  author?: string;
  year?: number;
  tune?: string;
  verses: string[];
  refrain?: string | null;
}

export interface HymnDisplayItem {
  hymnNumber: number;
  hymnTitle: string;
  text: string;
  type: 'verse' | 'refrain';
  verseNumber?: number;
  totalVerses: number;
  hasRefrain: boolean;
}

export interface HymnSearchResult {
  number: number;
  title: string;
  author?: string;
}
