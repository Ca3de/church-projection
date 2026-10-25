/**
 * Turn pasted hymn text into verses and a refrain.
 *
 * Accepts hymns the way they actually arrive — copied from a website or typed
 * from the hymnal:
 *   - verses numbered "1.", "1", "1mf", "2.f", "6 p" or "i.", "ii.", or just
 *     separated by blank lines
 *   - music dynamics at the start of a line: mf, mp, p, f, ff, pp, cr, dim
 *   - chorus labels: "Refrain:", "Ref.", "Chorus:", "Egbe:"
 *   - a chorus that isn't labelled at all, written once after verse 1
 *   - the chorus written out again after every verse, or abbreviated
 *     ("Egbe: Halleluyah Ogo...")
 *   - scansion marks: "di/vinely", "Father, / while", "ni|kanṣoṣo"
 *   - an author line: "[Joseph Addison]"
 *   - an optional heading line: "Hymn 788: When all Thy mercies", "(IOM 15) …"
 */

export interface ParsedStanza {
  kind: 'verse' | 'refrain';
  lines: string[];
}

export interface ParsedHeading {
  number?: string;
  /** "IOM" or "A & M" when the heading names a hymnbook */
  bookHint?: 'iom' | 'am';
  title?: string;
  /** IOM headings come as "English title/Yoruba title" */
  secondaryTitle?: string;
}

export interface ParsedHymnText {
  /** Verses and the refrain in reading order, the refrain listed once */
  stanzas: ParsedStanza[];
  verses: string[];
  refrain: string | null;
  author?: string;
  heading?: ParsedHeading;
  /** Things the operator should look at before saving */
  warnings: string[];
  /** Judgement calls the parser made, shown so they can be corrected */
  notes: string[];
}

const DYNAMIC = '(?:mf|mp|ff|pp|cr|dim|p|f)';
// Lowercase only: "Dim the lights" is a lyric, "dim My foes" is a marking
const LEADING_DYNAMIC = new RegExp(`^${DYNAMIC}(?:\\.\\s*|\\s+|$)`);
const NUMBER_MARKER = new RegExp(`^(\\d{1,2})(?=[.):]|\\s|${DYNAMIC}(?:[.\\s]|$))[.):]?\\s*`);
const ROMAN_MARKER = /^(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)[.)]\s*/i;
// "Chorus of angels" is a lyric; a label needs a colon or full stop, or to stand alone
const REFRAIN_MARKER = /^(?:refrain|ref|chorus|egbe|ègbè|ẹgbẹ)\s*(?:[:.]\s*|$)/i;
const AUTHOR_LINE = /^\[([^\]]*\p{L}[^\]]*)\]$/u;
const TRAILING_AUTHOR = /\s*\[([^\]]*\p{L}[^\]]*)\]\s*$/u;
const AMEN_ONLY = /^(?:amen|amin)[.!]?$/i;
const HEADING =
  /^\(?\s*(hymn|iom|a\s*&\s*m|a\s*and\s*m)?\s*(?:#|no\.?)?\s*(\d{1,4}|ys\s*\d{1,3})\s*\)?\s*(?:[:.\-–—]\s*|\s+|$)(.*)$/i;

const ROMAN_VALUES: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
};

/** Letters only, no accents, lowercase — for comparing two pieces of text. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function cleanLine(raw: string): string {
  let line = raw.replace(/\u00a0/g, ' ').replace(/\t/g, ' ').trim();
  // Scansion marks: "di/vinely" joins, "Father, / while" becomes a space
  line = line.replace(/(?<=\S)\s*[/|]\s*(?=\S)/g, (m) => (/\s/.test(m) ? ' ' : ''));
  line = line.replace(/^[/|]+|[/|]+$/g, '');
  return line.replace(/\s{2,}/g, ' ').trim();
}

function stripDynamic(text: string): string {
  return text.replace(LEADING_DYNAMIC, '').trim();
}

type Marker = { kind: 'verse'; number?: number } | { kind: 'refrain' } | null;

interface Block {
  marker: Marker;
  lines: string[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function parseHeading(line: string): ParsedHeading | null {
  const m = line.match(HEADING);
  if (!m) return null;
  const [, prefix, number, rest] = m;
  const isYs = /^ys/i.test(number);
  // Without a prefix, only a number of 2+ digits (or YS) reads as a heading —
  // "1. Abide with me" is verse 1, "788 When all Thy mercies" is hymn 788
  if (!prefix && !isYs && number.length < 2) return null;
  const bookKey = prefix?.toLowerCase().replace(/[^a-z]/g, '');
  const [title, secondaryTitle] = rest.split('/').map((t) => suggestTitle(t.trim()));
  return {
    number: isYs ? number.replace(/\s+/g, '').toUpperCase() : number,
    bookHint: bookKey === 'iom' ? 'iom' : bookKey === 'am' || bookKey === 'aandm' ? 'am' : undefined,
    title: title || undefined,
    secondaryTitle: secondaryTitle || undefined,
  };
}

export function parseHymnText(input: string): ParsedHymnText {
  const warnings: string[] = [];
  const notes: string[] = [];
  let author: string | undefined;
  let heading: ParsedHeading | undefined;

  // ── Pass 1: split into blocks at markers and blank lines ──
  const blocks: Block[] = [];
  let current: Block | null = null;
  let sawBlank = false;
  let firstContentLine = true;

  const rawLines = input.replace(/\r\n?/g, '\n').split('\n');
  for (const raw of rawLines) {
    let line = cleanLine(raw);
    if (!line) {
      sawBlank = true;
      continue;
    }

    if (firstContentLine) {
      firstContentLine = false;
      const h = parseHeading(raw.replace(/\u00a0/g, ' ').trim());
      if (h) {
        heading = h;
        continue;
      }
    }

    const authorLine = line.match(AUTHOR_LINE);
    if (authorLine) {
      author = authorLine[1].trim();
      continue;
    }
    const trailingAuthor = line.match(TRAILING_AUTHOR);
    if (trailingAuthor) {
      author = trailingAuthor[1].trim();
      line = line.replace(TRAILING_AUTHOR, '').trim();
      if (!line) continue;
    }

    let marker: Marker = null;
    let rest = line;
    const refrainMatch = line.match(REFRAIN_MARKER);
    const numberMatch = line.match(NUMBER_MARKER);
    const romanMatch = line.match(ROMAN_MARKER);
    if (refrainMatch) {
      marker = { kind: 'refrain' };
      rest = line.slice(refrainMatch[0].length);
    } else if (numberMatch) {
      marker = { kind: 'verse', number: parseInt(numberMatch[1], 10) };
      rest = line.slice(numberMatch[0].length);
    } else if (romanMatch) {
      marker = { kind: 'verse', number: ROMAN_VALUES[romanMatch[1].toLowerCase()] };
      rest = line.slice(romanMatch[0].length);
    }
    rest = stripDynamic(rest);

    if (marker || sawBlank || !current) {
      current = { marker, lines: [] };
      blocks.push(current);
    }
    if (rest) current.lines.push(rest);
    sawBlank = false;
  }

  // An "Amen" on its own line belongs to the end of the last line
  const last = blocks[blocks.length - 1];
  if (last && last.lines.length > 1 && AMEN_ONLY.test(last.lines[last.lines.length - 1])) {
    const amen = last.lines.pop()!;
    last.lines[last.lines.length - 1] += ` ${amen}`;
  }

  const nonEmpty = blocks.filter((b) => b.lines.length > 0);
  const markedVerses = nonEmpty.filter((b) => b.marker?.kind === 'verse');
  const numbered = markedVerses.length >= 2;
  const typicalLength = median(markedVerses.map((b) => b.lines.length));

  // ── Pass 2: decide what each block is ──
  const stanzas: ParsedStanza[] = [];
  let refrain: string[] | null = null;
  let refrainFold = '';

  let trailingAmen = '';
  const addRefrain = (lines: string[], explicit: boolean) => {
    const joined = lines.join(' ');
    const text = fold(joined);
    const abbreviated = /\.\.\.|…/.test(joined);
    const amenAfter = joined.match(/(?:\.\.\.|…)\s*((?:amen|amin)[.!]?)\s*$/i);
    if (amenAfter) trailingAmen = amenAfter[1];
    if (!refrain) {
      if (abbreviated) {
        notes.push(`A chorus starting “${lines[0].replace(/(\.\.\.|…)$/, '')}” is abbreviated — paste it in full once.`);
      }
      refrain = lines;
      refrainFold = text;
      stanzas.push({ kind: 'refrain', lines });
      return;
    }
    // Repeats after each verse — full, or cut short with "..." — are dropped
    const stem = fold(joined.split(/\.\.\.|…/)[0]);
    if (text === refrainFold || abbreviated || refrainFold.startsWith(stem)) return;
    if (explicit) {
      notes.push(`A second, different chorus (“${lines[0]}”) was left out — only one chorus per hymn is supported.`);
    } else {
      stanzas.push({ kind: 'verse', lines });
    }
  };

  nonEmpty.forEach((block, index) => {
    if (block.marker?.kind === 'refrain') {
      addRefrain(block.lines, true);
      return;
    }
    if (block.marker?.kind === 'verse' || index === 0) {
      stanzas.push({ kind: 'verse', lines: block.lines });
      return;
    }

    // An unmarked block after a blank line
    const previous = stanzas[stanzas.length - 1];
    if (numbered) {
      if (previous?.kind === 'verse' && previous.lines.length + block.lines.length <= typicalLength) {
        // A verse that was split by a stray blank line
        previous.lines.push(...block.lines);
        return;
      }
      if (!refrain) {
        const after = stanzas.filter((s) => s.kind === 'verse').length;
        notes.push(`The unlabelled lines after verse ${after} (“${block.lines[0]}”) are being used as the chorus.`);
      }
      addRefrain(block.lines, false);
      return;
    }

    // Verses separated only by blank lines; a block written out more than once is the chorus
    const text = fold(block.lines.join(' '));
    const repeated = nonEmpty.some((other, j) => j !== index && fold(other.lines.join(' ')) === text);
    if (repeated || (refrain && text === refrainFold)) {
      addRefrain(block.lines, false);
    } else {
      stanzas.push({ kind: 'verse', lines: block.lines });
    }
  });

  const verseStanzas = stanzas.filter((s) => s.kind === 'verse');

  // "Egbe: Halleluyah Ogo... Amin" — the Amen closes the hymn
  const lastVerse = verseStanzas[verseStanzas.length - 1];
  if (trailingAmen && lastVerse && !/(amen|amin)[.!]?$/i.test(lastVerse.lines[lastVerse.lines.length - 1])) {
    lastVerse.lines[lastVerse.lines.length - 1] += ` ${trailingAmen}`;
  }

  // ── Checks worth showing before saving ──
  const numbers = markedVerses.map((b) => (b.marker as { number?: number }).number!).filter(Boolean);
  if (numbers.length >= 2) {
    // Verse 1 may legitimately be unnumbered, so start from the first number seen
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i - 1] + 1) {
        warnings.push(
          numbers[i] > numbers[i - 1] + 1
            ? `Verse numbers jump from ${numbers[i - 1]} to ${numbers[i]} — is a verse missing?`
            : `Verse ${numbers[i]} appears out of order after verse ${numbers[i - 1]}.`
        );
        break;
      }
    }
  }
  const usual = median(verseStanzas.map((s) => s.lines.length));
  verseStanzas.forEach((s, i) => {
    if (usual >= 4 && s.lines.length <= usual / 2) {
      warnings.push(`Verse ${i + 1} has ${s.lines.length} line${s.lines.length === 1 ? '' : 's'} where the others have ${usual} — part of it may be missing.`);
    }
  });

  return {
    stanzas,
    verses: verseStanzas.map((s) => s.lines.join('\n')),
    refrain: refrain ? (refrain as string[]).join('\n') : null,
    author,
    heading,
    warnings,
    notes,
  };
}

/** A title from a first line: "Love divine, all loves excelling," → "Love Divine, All Loves Excelling" */
export function suggestTitle(firstLine: string | undefined): string {
  if (!firstLine) return '';
  return firstLine
    .replace(/[\s,;:.!—–-]+$/, '')
    .split(' ')
    .map((word) => word.replace(/\p{L}/u, (c) => c.toUpperCase()))
    .join(' ');
}

/** Write a hymn back out as text the parser reads identically — for editing. */
export function hymnToText(verses: string[], refrain?: string | null): string {
  const parts = verses.map((v, i) => `${i + 1}. ${v}`);
  if (refrain) parts.splice(Math.min(1, parts.length), 0, `Refrain:\n${refrain}`);
  return parts.join('\n\n');
}
