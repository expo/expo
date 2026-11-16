import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LINK_TEXT_BLOCKLIST } from './link-text-blocklist.ts';

const DOCS_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PAGES_DIR = path.join(DOCS_ROOT, 'pages');
const API_DATA_DIR = path.join(DOCS_ROOT, 'public', 'static', 'data');

const MARKDOWN_LINK = /\[([^[\]]*)]\(\s*<?([^\s)>]+)/g;

interface Violation {
  where: string;
  text: string;
  url: string;
  source?: string;
}

interface ContentNode {
  text: string;
}

function listFiles(dir: string, extension: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, extension));
    } else if (entry.name.endsWith(extension)) {
      out.push(full);
    }
  }
  return out;
}

function blankCodeFences(content: string): string {
  let fence: string | null = null;
  return content
    .split('\n')
    .map(line => {
      const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (match) {
        const marker = match[1][0];
        if (fence === null) {
          fence = marker;
          return '';
        }
        if (marker === fence) {
          fence = null;
          return '';
        }
      }
      return fence === null ? line : '';
    })
    .join('\n');
}

function normalize(text: string): string {
  return text.replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isBlocked(text: string): boolean {
  return LINK_TEXT_BLOCKLIST.phrases.includes(normalize(text));
}

function isAudited(url: string): boolean {
  return !url.startsWith('#') && !/^(?:mailto|javascript):/i.test(url);
}

function isContentArray(value: unknown): value is ContentNode[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      item =>
        item !== null && typeof item === 'object' && typeof (item as ContentNode).text === 'string'
    )
  );
}

function walkApiData(
  node: unknown,
  symbol: string,
  onComment: (symbol: string, markdown: string) => void
): void {
  if (isContentArray(node)) {
    onComment(symbol, node.map(item => item.text).join(''));
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkApiData(item, symbol, onComment);
    }
    return;
  }
  if (node !== null && typeof node === 'object') {
    const name = (node as { name?: unknown }).name;
    const nextSymbol = typeof name === 'string' ? name : symbol;
    for (const value of Object.values(node)) {
      walkApiData(value, nextSymbol, onComment);
    }
  }
}

function tsdocSource(relFile: string): string {
  const segments = relFile.split(path.sep);
  const packagePath = segments.slice(segments.indexOf('data') + 2).join('/');
  return `packages/${packagePath.replace(/\.json$/, '')}/src`;
}

function versionSegment(relFile: string): string | null {
  const segments = relFile.split(path.sep);
  if (segments[0] === 'pages' && segments[1] === 'versions') {
    return segments[2] ?? null;
  }
  if (segments[0] === 'public' && segments[1] === 'static' && segments[2] === 'data') {
    return segments[3] ?? null;
  }
  return null;
}

function isChecked(relFile: string): boolean {
  if (LINK_TEXT_BLOCKLIST.ignorePaths.some(prefix => relFile.startsWith(prefix))) {
    return false;
  }
  const version = versionSegment(relFile);
  return version === null || LINK_TEXT_BLOCKLIST.checkedVersions.includes(version);
}

function collect(): { scanned: number; violations: Violation[] } {
  let scanned = 0;
  const violations: Violation[] = [];

  const record = (candidate: Violation & { text: string; url: string }) => {
    if (!isAudited(candidate.url)) {
      return;
    }
    scanned++;
    if (isBlocked(candidate.text)) {
      violations.push({ ...candidate, text: candidate.text.trim() });
    }
  };

  for (const file of listFiles(PAGES_DIR, '.mdx')) {
    const relFile = path.relative(DOCS_ROOT, file);
    if (!isChecked(relFile)) {
      continue;
    }
    const lines = blankCodeFences(fs.readFileSync(file, 'utf8')).split('\n');

    lines.forEach((line, index) => {
      MARKDOWN_LINK.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MARKDOWN_LINK.exec(line))) {
        record({ where: `${relFile}:${index + 1}`, text: match[1], url: match[2] });
      }
    });
  }

  for (const file of listFiles(API_DATA_DIR, '.json')) {
    const relFile = path.relative(DOCS_ROOT, file);
    if (!isChecked(relFile)) {
      continue;
    }
    const source = tsdocSource(relFile);

    walkApiData(JSON.parse(fs.readFileSync(file, 'utf8')), '', (symbol, markdown) => {
      MARKDOWN_LINK.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MARKDOWN_LINK.exec(markdown))) {
        record({
          where: `${relFile}${symbol ? ` (${symbol})` : ''}`,
          text: match[1],
          url: match[2],
          source,
        });
      }
    });
  }

  return { scanned, violations };
}

const GUIDANCE = [
  'Lighthouse fails the link-text audit for any link whose rendered text exactly matches a generic',
  'phrase, costing the page all of its link-text SEO weight. One bad link fails the whole page, so',
  'partial fixes score the same as none. Rewrite each link so the text names its destination.',
  '',
  'Entries under public/static/data are generated from TSDoc. Fix the comment in the package source',
  'listed above, run `et gdad -p <package>` to refresh unversioned, then patch the same string in the',
  'versioned JSON, which is what the live page serves.',
].join('\n');

describe('docs link text', () => {
  const { scanned, violations } = collect();

  it('scans a meaningful number of links (guards against a vacuous pass)', () => {
    expect(scanned).toBeGreaterThan(1000);
  });

  it('no link text on the Lighthouse link-text blocklist', () => {
    const listed = violations.map(
      violation =>
        `${violation.where}  "${violation.text}" -> ${violation.url}` +
        (violation.source ? `\n    TSDoc source: ${violation.source}` : '')
    );
    const report = listed.length ? `${listed.join('\n')}\n\n${GUIDANCE}` : '';
    expect(report).toBe('');
  });
});
