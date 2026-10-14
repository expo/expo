/* oxlint-disable no-console */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseRedirects } from '../internal-links/redirects.ts';

type DraftCase = {
  id: string;
  path: string;
  expectedPaths: string[];
  category: string;
  sourcePath: string;
  split: 'dev' | 'test';
  reviewed: false;
};

const SYNONYMS: Record<string, string> = {
  authentication: 'sign-in',
  permissions: 'request-access',
  camera: 'take-photos',
  imagepicker: 'choose-photos',
  'image-picker': 'choose-photos',
  securestore: 'encrypted-storage',
  filesystem: 'read-write-files',
  notifications: 'push-messages',
  localization: 'translations',
  'splash-screen': 'launch-screen',
  haptics: 'vibration-feedback',
  sharing: 'share-sheet',
  clipboard: 'copy-and-paste',
  speech: 'text-to-speech',
  contacts: 'address-book',
  webview: 'embedded-browser',
  battery: 'battery-level',
  location: 'gps-position',
  sqlite: 'sql-database',
  'screen-orientation': 'device-rotation',
};
const UNRELATED = [
  'sourdough-starter',
  'passport-renewal',
  'orchid-care',
  'mortgage-rates',
  'train-timetables',
  'wedding-venues',
  'guitar-chords',
  'dog-vaccinations',
  'pasta-recipes',
  'camping-permits',
  'coffee-grinding',
  'marathon-training',
  'bicycle-chain-repair',
  'ceramic-glazing',
  'watercolor-techniques',
  'knitting-patterns',
  'museum-opening-hours',
  'beekeeping-equipment',
  'lawn-irrigation',
  'chess-openings',
];
const GENERIC = new Set([
  'introduction',
  'overview',
  'faq',
  'setup',
  'reference',
  'index',
  'get-started',
  'config',
  'schema',
  'settings',
  'configuration',
  'troubleshooting',
]);
const CATEGORIES = [
  'slug-typo',
  'missing-segment',
  'wrong-directory',
  'moved-structure',
  'topic-synonym',
];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const family = (value: string) =>
  value.replace(/^\/ja\//, '/').replace(/^\/versions\/[^/]+\//, '/versions/*/');

function parts(source: string) {
  const prefix = source.match(/^\/(?:ja\/)?(?:versions\/[^/]+\/)?/)![0];
  return { prefix, segments: source.slice(prefix.length).split('/').filter(Boolean) };
}

function variant(source: string, category: string): string | undefined {
  const { prefix, segments } = parts(source);
  const leaf = segments.at(-1)!;
  if (category === 'slug-typo') {
    const position = Math.floor(leaf.length / 2);
    segments[segments.length - 1] = leaf.slice(0, position) + leaf.slice(position + 1);
  } else if (category === 'missing-segment') {
    if (segments.length < 2) {
      return;
    }
    segments.splice(0, 1);
  } else if (category === 'wrong-directory') {
    if (segments.length < 2) {
      return;
    }
    segments[0] = segments[0] === 'guides' ? 'router' : 'guides';
  } else if (category === 'moved-structure') {
    segments.splice(segments.length - 1, 0, segments[0] === 'sdk' ? 'reference' : 'how-to');
  } else {
    if (!SYNONYMS[leaf]) {
      return;
    }
    segments[segments.length - 1] = SYNONYMS[leaf];
  }
  return prefix + segments.join('/') + '/';
}

export function generateCases(inventory: { path: string }[], redirectContent: string): DraftCase[] {
  const paths = new Set(inventory.map(page => page.path));
  const redirects = parseRedirects(redirectContent);
  const seen = new Set<string>();
  const cases: DraftCase[] = [];
  const sources = [...paths].filter(source => {
    const leaf = parts(source).segments.at(-1);
    return leaf && leaf.length >= 5 && !GENERIC.has(leaf);
  });
  const scopes: [string, number, number][] = [
    ['general', 120, 30],
    ['latest', 60, 15],
    ...['v54.0.0', 'v55.0.0', 'v56.0.0', 'v57.0.0', 'v58.0.0'].map(
      version => [version, 8, 2] as [string, number, number]
    ),
    ['ja', 20, 5],
  ];
  function add(sourcePath: string, input: string | undefined, category: string) {
    if (
      !input ||
      seen.has(input) ||
      paths.has(input) ||
      redirects.literal.has(input.replace(/\/$/, '')) ||
      redirects.splats.some(rule => rule.regex?.test(input))
    ) {
      return false;
    }
    seen.add(input);
    cases.push({
      id: hash(`${sourcePath}|${category}|${input}`).slice(0, 12),
      path: input,
      expectedPaths: category === 'no-match' ? [] : [sourcePath],
      category,
      sourcePath,
      split: parseInt(hash(family(sourcePath)).slice(0, 8), 16) % 5 === 0 ? 'test' : 'dev',
      reviewed: false,
    });
    return true;
  }
  for (const [scope, positiveCount, negativeCount] of scopes) {
    const scoped = sources.filter(
      source =>
        (source.startsWith('/ja/')
          ? 'ja'
          : (source.match(/^\/versions\/([^/]+)\//)?.[1] ?? 'general')) === scope
    );
    const ordered = (seed: string) =>
      [...scoped].sort((a, b) => hash(seed + a).localeCompare(hash(seed + b)));
    const pools = CATEGORIES.map(category =>
      ordered(category).map(source => ({ source, input: variant(source, category), category }))
    );
    const usedSources = new Map<string, number>();
    let added = 0;
    while (added < positiveCount && pools.some(pool => pool.length)) {
      for (const pool of pools) {
        while (pool.length && added < positiveCount) {
          const candidate = pool.shift()!;
          if (
            (usedSources.get(candidate.source) ?? 0) >= 2 ||
            !add(candidate.source, candidate.input, candidate.category)
          ) {
            continue;
          }
          usedSources.set(candidate.source, (usedSources.get(candidate.source) ?? 0) + 1);
          added++;
          break;
        }
      }
    }
    if (added !== positiveCount) {
      throw new Error(`Not enough positive candidates for ${scope}: ${added}`);
    }
    let negatives = 0;
    for (const source of ordered('no-match')) {
      const { prefix, segments } = parts(source);
      segments[segments.length - 1] =
        UNRELATED[parseInt(hash(source).slice(0, 8), 16) % UNRELATED.length];
      if (add(source, prefix + segments.join('/') + '/', 'no-match')) {
        negatives++;
      }
      if (negatives === negativeCount) {
        break;
      }
    }
    if (negatives !== negativeCount) {
      throw new Error(`Not enough negative candidates for ${scope}: ${negatives}`);
    }
  }
  return cases;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argument = (name: string) => process.argv[process.argv.indexOf(name) + 1];
  if (!process.argv.includes('--inventory') || !process.argv.includes('--output')) {
    throw new Error(
      'Usage: generate.ts --inventory inventory.json --output cases.jsonl [--overwrite]'
    );
  }
  const inventory = JSON.parse(fs.readFileSync(argument('--inventory'), 'utf8'));
  const redirects = fs.readFileSync(new URL('../../public/_redirects', import.meta.url), 'utf8');
  const cases = generateCases(inventory, redirects);
  fs.writeFileSync(argument('--output'), cases.map(row => JSON.stringify(row)).join('\n') + '\n', {
    flag: process.argv.includes('--overwrite') ? 'w' : 'wx',
  });
  console.log(`Generated ${cases.length} draft cases; all labels require review.`);
}
