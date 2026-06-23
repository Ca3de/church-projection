#!/usr/bin/env node
/**
 * Downloads public-domain Bible translations from bible.helloao.org
 * and writes one JSON file per book under public/bibles/.
 *
 * Output: public/bibles/{versionId}/{bookSlug}.json
 *   { "1": { "1": "verse text", "2": "..." }, "2": {...} }
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
const API = 'https://bible.helloao.org/api';

// Map our internal version ids to helloao translation ids.
const VERSION_MAP = {
  'en-kjv': 'eng_kjv',
  'en-asv': 'eng_asv',
  'en-web': 'eng_web',
  'en-ylt': 'eng_ylt',
  'en-bbe': 'eng_bbe',
  'en-darby': 'eng_dby',
  'en-dra': 'eng_dra',
};

// Map helloao book ids (USFM codes) to our file slugs.
const BOOK_SLUG = {
  GEN: 'genesis', EXO: 'exodus', LEV: 'leviticus', NUM: 'numbers', DEU: 'deuteronomy',
  JOS: 'joshua', JDG: 'judges', RUT: 'ruth', '1SA': '1samuel', '2SA': '2samuel',
  '1KI': '1kings', '2KI': '2kings', '1CH': '1chronicles', '2CH': '2chronicles',
  EZR: 'ezra', NEH: 'nehemiah', EST: 'esther', JOB: 'job', PSA: 'psalms',
  PRO: 'proverbs', ECC: 'ecclesiastes', SNG: 'songofsolomon', ISA: 'isaiah',
  JER: 'jeremiah', LAM: 'lamentations', EZK: 'ezekiel', DAN: 'daniel',
  HOS: 'hosea', JOL: 'joel', AMO: 'amos', OBA: 'obadiah', JON: 'jonah',
  MIC: 'micah', NAM: 'nahum', HAB: 'habakkuk', ZEP: 'zephaniah', HAG: 'haggai',
  ZEC: 'zechariah', MAL: 'malachi', MAT: 'matthew', MRK: 'mark', LUK: 'luke',
  JHN: 'john', ACT: 'acts', ROM: 'romans', '1CO': '1corinthians', '2CO': '2corinthians',
  GAL: 'galatians', EPH: 'ephesians', PHP: 'philippians', COL: 'colossians',
  '1TH': '1thessalonians', '2TH': '2thessalonians', '1TI': '1timothy', '2TI': '2timothy',
  TIT: 'titus', PHM: 'philemon', HEB: 'hebrews', JAS: 'james', '1PE': '1peter',
  '2PE': '2peter', '1JN': '1john', '2JN': '2john', '3JN': '3john', JUD: 'jude',
  REV: 'revelation',
};

function parseArgs() {
  const args = { versions: Object.keys(VERSION_MAP), force: false };
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

// Flatten the helloao verse `content` (array of strings and {noteId} objects) into plain text.
function verseText(content) {
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const item of content) {
    if (typeof item === 'string') {
      parts.push(item);
    } else if (item && typeof item === 'object') {
      if (typeof item.text === 'string') parts.push(item.text);
      // Skip {noteId}, line breaks, headings — we only want verse prose.
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

async function syncVersion(versionId, force) {
  const helloId = VERSION_MAP[versionId];
  if (!helloId) {
    console.error(`Unknown version: ${versionId}`);
    return;
  }

  const versionDir = join(OUT_DIR, versionId);
  if (!force) {
    // Quick check: if all 66 book files exist, skip the whole translation.
    const expectedSlugs = Object.values(BOOK_SLUG);
    const allPresent = (
      await Promise.all(expectedSlugs.map((slug) => exists(join(versionDir, `${slug}.json`))))
    ).every(Boolean);
    if (allPresent) {
      console.log(`${versionId}: all 66 books present, skipping`);
      return;
    }
  }

  console.log(`${versionId}: fetching complete Bible...`);
  const start = Date.now();
  const r = await fetch(`${API}/${helloId}/complete.json`);
  if (!r.ok) {
    console.error(`${versionId}: HTTP ${r.status}`);
    return;
  }
  const data = await r.json();
  console.log(`${versionId}: downloaded in ${((Date.now() - start) / 1000).toFixed(1)}s`);

  await mkdir(versionDir, { recursive: true });
  let wrote = 0;
  for (const book of data.books) {
    const slug = BOOK_SLUG[book.id];
    if (!slug) {
      console.warn(`${versionId}: unknown book id ${book.id} (${book.commonName}), skipping`);
      continue;
    }
    const out = {};
    for (const ch of book.chapters) {
      const chNum = ch.chapter?.number;
      if (chNum == null) continue;
      const verses = {};
      for (const item of ch.chapter.content || []) {
        if (item.type !== 'verse') continue;
        const text = verseText(item.content);
        if (text) verses[item.number] = text;
      }
      out[chNum] = verses;
    }
    await writeFile(join(versionDir, `${slug}.json`), JSON.stringify(out));
    wrote++;
  }
  console.log(`${versionId}: wrote ${wrote} books\n`);
}

async function main() {
  const { versions, force } = parseArgs();
  console.log(`Syncing: ${versions.join(', ')}${force ? ' (force)' : ''}`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const v of versions) {
    try {
      await syncVersion(v, force);
    } catch (err) {
      console.error(`${v}: failed —`, err.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
