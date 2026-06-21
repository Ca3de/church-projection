#!/usr/bin/env node
/**
 * Downloads public-domain Bible translations from the wldeh/bible-api CDN
 * and consolidates each book into a single JSON file under public/bibles/.
 *
 * Format: public/bibles/{versionId}/{bookSlug}.json
 *   { "1": { "1": "verse text", "2": "..." }, "2": {...} }
 *
 * Skips books that already have a file (incremental). Pass --force to redownload.
 *
 * Usage:
 *   node scripts/sync-bibles.mjs [--versions=en-kjv,en-asv] [--force]
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'bibles');
const CDN = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

const ALL_VERSIONS = ['en-kjv', 'en-asv', 'en-web', 'en-ylt', 'en-bbe', 'en-darby', 'en-dra'];

const BOOKS = [
  { slug: 'genesis', chapters: 50 },
  { slug: 'exodus', chapters: 40 },
  { slug: 'leviticus', chapters: 27 },
  { slug: 'numbers', chapters: 36 },
  { slug: 'deuteronomy', chapters: 34 },
  { slug: 'joshua', chapters: 24 },
  { slug: 'judges', chapters: 21 },
  { slug: 'ruth', chapters: 4 },
  { slug: '1samuel', chapters: 31 },
  { slug: '2samuel', chapters: 24 },
  { slug: '1kings', chapters: 22 },
  { slug: '2kings', chapters: 25 },
  { slug: '1chronicles', chapters: 29 },
  { slug: '2chronicles', chapters: 36 },
  { slug: 'ezra', chapters: 10 },
  { slug: 'nehemiah', chapters: 13 },
  { slug: 'esther', chapters: 10 },
  { slug: 'job', chapters: 42 },
  { slug: 'psalms', chapters: 150 },
  { slug: 'proverbs', chapters: 31 },
  { slug: 'ecclesiastes', chapters: 12 },
  { slug: 'songofsolomon', chapters: 8 },
  { slug: 'isaiah', chapters: 66 },
  { slug: 'jeremiah', chapters: 52 },
  { slug: 'lamentations', chapters: 5 },
  { slug: 'ezekiel', chapters: 48 },
  { slug: 'daniel', chapters: 12 },
  { slug: 'hosea', chapters: 14 },
  { slug: 'joel', chapters: 3 },
  { slug: 'amos', chapters: 9 },
  { slug: 'obadiah', chapters: 1 },
  { slug: 'jonah', chapters: 4 },
  { slug: 'micah', chapters: 7 },
  { slug: 'nahum', chapters: 3 },
  { slug: 'habakkuk', chapters: 3 },
  { slug: 'zephaniah', chapters: 3 },
  { slug: 'haggai', chapters: 2 },
  { slug: 'zechariah', chapters: 14 },
  { slug: 'malachi', chapters: 4 },
  { slug: 'matthew', chapters: 28 },
  { slug: 'mark', chapters: 16 },
  { slug: 'luke', chapters: 24 },
  { slug: 'john', chapters: 21 },
  { slug: 'acts', chapters: 28 },
  { slug: 'romans', chapters: 16 },
  { slug: '1corinthians', chapters: 16 },
  { slug: '2corinthians', chapters: 13 },
  { slug: 'galatians', chapters: 6 },
  { slug: 'ephesians', chapters: 6 },
  { slug: 'philippians', chapters: 4 },
  { slug: 'colossians', chapters: 4 },
  { slug: '1thessalonians', chapters: 5 },
  { slug: '2thessalonians', chapters: 3 },
  { slug: '1timothy', chapters: 6 },
  { slug: '2timothy', chapters: 4 },
  { slug: 'titus', chapters: 3 },
  { slug: 'philemon', chapters: 1 },
  { slug: 'hebrews', chapters: 13 },
  { slug: 'james', chapters: 5 },
  { slug: '1peter', chapters: 5 },
  { slug: '2peter', chapters: 3 },
  { slug: '1john', chapters: 5 },
  { slug: '2john', chapters: 1 },
  { slug: '3john', chapters: 1 },
  { slug: 'jude', chapters: 1 },
  { slug: 'revelation', chapters: 22 },
];

const MAX_VERSE_PROBE = 200; // Highest possible verse number in any chapter
const CONCURRENCY = 40;

function parseArgs() {
  const args = { versions: ALL_VERSIONS, force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--force') args.force = true;
    else if (arg.startsWith('--versions=')) {
      args.versions = arg.slice('--versions='.length).split(',').filter(Boolean);
    }
  }
  return args;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function withConcurrency(items, fn, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const myIdx = idx++;
      if (myIdx >= items.length) return;
      results[myIdx] = await fn(items[myIdx], myIdx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function downloadChapter(version, book, chapter) {
  const verseNumbers = Array.from({ length: MAX_VERSE_PROBE }, (_, i) => i + 1);
  const verses = await withConcurrency(
    verseNumbers,
    async (v) => {
      const url = `${CDN}/${version}/books/${book}/chapters/${chapter}/verses/${v}.json`;
      const data = await fetchJson(url);
      return data && typeof data.text === 'string' ? { verse: v, text: data.text } : null;
    },
    CONCURRENCY
  );
  const out = {};
  for (const v of verses) if (v) out[v.verse] = v.text;
  return out;
}

async function downloadBook(version, bookDef, force) {
  const outFile = join(OUT_DIR, version, `${bookDef.slug}.json`);
  if (!force && (await exists(outFile))) {
    return { skipped: true };
  }
  const chapters = {};
  for (let c = 1; c <= bookDef.chapters; c++) {
    const verses = await downloadChapter(version, bookDef.slug, c);
    const count = Object.keys(verses).length;
    if (count === 0) {
      console.warn(`    chapter ${c}: empty (likely missing in this translation)`);
    }
    chapters[c] = verses;
  }
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(chapters));
  return { skipped: false };
}

async function main() {
  const { versions, force } = parseArgs();
  console.log(`Syncing versions: ${versions.join(', ')}${force ? ' (force)' : ''}`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const version of versions) {
    console.log(`== ${version} ==`);
    let downloaded = 0;
    let skipped = 0;
    for (const book of BOOKS) {
      process.stdout.write(`  ${book.slug.padEnd(18)} `);
      const start = Date.now();
      try {
        const result = await downloadBook(version, book, force);
        if (result.skipped) {
          console.log('skipped');
          skipped++;
        } else {
          console.log(`done (${((Date.now() - start) / 1000).toFixed(1)}s)`);
          downloaded++;
        }
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
    }
    console.log(`  ${version}: ${downloaded} downloaded, ${skipped} skipped\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
