/** Which hymnbook a hymn belongs to. Numbers are only unique within a book. */
export type HymnBookId = 'main' | 'iom' | 'am';

export interface Hymn {
  /**
   * Internal id, unique across all books. Books other than the main hymnal
   * are offset (see HYMN_BOOKS), so IOM 15 and main-hymnal 15 never collide.
   */
  number: number;
  displayNumber?: string; // What the congregation sees: "YS1", "IOM 15", "A & M 319"
  book?: HymnBookId; // Defaults to 'main'
  title: string;
  author?: string;
  year?: number;
  tune?: string;
  verses: string[];
  refrain?: string | null;
  /** Parallel text for bilingual books — shown side by side with the primary text. */
  secondaryLanguage?: string;
  secondaryTitle?: string;
  secondaryVerses?: string[];
  secondaryRefrain?: string | null;
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
  secondaryTitle?: string;
  secondaryText?: string;
  secondaryLanguage?: string;
}

export interface HymnSearchResult {
  number: number;
  displayNumber?: string;
  title: string;
  author?: string;
  book?: HymnBookId;
  secondaryTitle?: string;
}
