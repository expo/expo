import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = fileURLToPath(new URL('../', import.meta.url));
const API_DATA_DIR = path.join(DOCS_ROOT, 'public', 'static', 'data');

// Case-insensitive, lowercase entries. For intentional doubles like "had had".
const ALLOWED_REPEATS = new Set<string>([]);

const REPEATED_WORD = /\b([A-Za-z]{2,})\s+\1\b/gi;

interface Violation {
  where: string;
  repeat: string;
  context: string;
  source: string;
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

// Code spans become a non-alphabetic token so "from `0` to `1` to" does not
// read as an adjacent "to to". A leading bold callout keyword in a blockquote
// is a directive consumed by InlineHelp, not rendered prose.
function proseOnly(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ~ ')
    .replace(/`[^`\n]*`/g, ' ~ ')
    .replace(/^(\s*>\s*)\*\*(warning|error|info|important)\*\*\s*/gim, '$1')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_]/g, '');
}

function collect(): { scanned: number; violations: Violation[] } {
  let scanned = 0;
  const violations: Violation[] = [];

  for (const file of listFiles(API_DATA_DIR, '.json')) {
    const relFile = path.relative(DOCS_ROOT, file);
    const source = tsdocSource(relFile);

    walkApiData(JSON.parse(fs.readFileSync(file, 'utf8')), '', (symbol, markdown) => {
      scanned++;
      for (const paragraph of proseOnly(markdown).split(/\n\s*\n/)) {
        REPEATED_WORD.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = REPEATED_WORD.exec(paragraph))) {
          if (ALLOWED_REPEATS.has(match[1].toLowerCase())) {
            continue;
          }
          const start = Math.max(0, match.index - 40);
          const context = paragraph
            .slice(start, match.index + match[0].length + 40)
            .replace(/\s+/g, ' ')
            .trim();
          violations.push({
            where: `${relFile}${symbol ? ` (${symbol})` : ''}`,
            repeat: match[0],
            context,
            source,
          });
        }
      }
    });
  }

  return { scanned, violations };
}

const GUIDANCE = [
  'A word appears twice in a row (for example "the the") in an API description, which reads as a',
  'typo on the rendered SDK page. Prose in .mdx pages is covered by the Vale Repetition rule; this',
  'check covers the API reference data generated from TSDoc, which Vale cannot lint.',
  '',
  'Entries under public/static/data are generated from TSDoc. Fix the comment in the package source',
  'listed above, run `et gdad -p <package>` to refresh unversioned, then patch the same string in the',
  'versioned JSON, which is what the live page serves. For an intentional double (like "had had"),',
  'add the word to ALLOWED_REPEATS in checks/check-repeated-words.test.ts instead.',
].join('\n');

describe('docs repeated words', () => {
  const { scanned, violations } = collect();

  it('scans a meaningful number of API descriptions (guards against a vacuous pass)', () => {
    expect(scanned).toBeGreaterThan(10000);
  });

  it('no doubled words in TSDoc-generated API descriptions', () => {
    const listed = violations.map(
      violation =>
        `${violation.where}  "${violation.repeat}"  …${violation.context}…` +
        `\n    TSDoc source: ${violation.source}`
    );
    const report = listed.length ? `${listed.join('\n')}\n\n${GUIDANCE}` : '';
    expect(report).toBe('');
  });
});
