import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PAGES_DIR = path.join(DOCS_ROOT, 'pages');

const CONTENT_SPOTLIGHT = /<ContentSpotlight\b[\S\s]*?\/>/g;
const DIAGRAM = /<Diagram\b[\S\s]*?\/>/g;
const IMG_TAG = /<img\b[\S\s]*?\/?>/gi;
const MARKDOWN_IMAGE = /!\[([^\]]*)]\(/g;
const ALT_ATTR = /\balt=("([^"]*)"|'([^']*)'|{[^}]*})/;
const IMAGE_SRC = /\b(?:src|darkSrc)=/;
const ALLOW_EMPTY_ALT = /{\/\*\s*allow-empty-alt:\s*\S.*?\*\/}/;

interface Violation {
  file: string;
  line: number;
  kind: string;
}

function listMdxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMdxFiles(full));
    } else if (entry.name.endsWith('.mdx')) {
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

function stripInlineCode(content: string): string {
  return content.replace(/`[^\n`]+`/g, match => ' '.repeat(match.length));
}

function hasNonEmptyAlt(block: string): boolean {
  const match = block.match(ALT_ATTR);
  if (!match) {
    return false;
  }
  if (match[1].startsWith('{')) {
    return true;
  }
  return (match[2] ?? match[3] ?? '').trim().length > 0;
}

function collect(): { scanned: number; violations: Violation[] } {
  let scanned = 0;
  const violations: Violation[] = [];

  for (const file of listMdxFiles(PAGES_DIR)) {
    const relFile = path.relative(DOCS_ROOT, file);
    const content = stripInlineCode(blankCodeFences(fs.readFileSync(file, 'utf8')));
    const lines = content.split('\n');
    const lineAt = (index: number) => content.slice(0, index).split('\n').length;
    const exemptAt = (startLine: number, block: string) =>
      ALLOW_EMPTY_ALT.test(block) || (startLine > 1 && ALLOW_EMPTY_ALT.test(lines[startLine - 2]));

    const check = (block: string, index: number, kind: string) => {
      scanned++;
      const startLine = lineAt(index);
      if (!hasNonEmptyAlt(block) && !exemptAt(startLine, block)) {
        violations.push({ file: relFile, line: startLine, kind });
      }
    };

    for (const m of content.matchAll(CONTENT_SPOTLIGHT)) {
      if (IMAGE_SRC.test(m[0])) {
        check(m[0], m.index, 'ContentSpotlight missing alt');
      }
    }
    for (const m of content.matchAll(DIAGRAM)) {
      check(m[0], m.index, 'Diagram missing alt');
    }
    for (const m of content.matchAll(IMG_TAG)) {
      if (/\bsrc=/i.test(m[0])) {
        check(m[0], m.index, '<img> missing alt');
      }
    }
    for (const m of content.matchAll(MARKDOWN_IMAGE)) {
      scanned++;
      const startLine = lineAt(m.index);
      if (!m[1].trim() && !exemptAt(startLine, m[0])) {
        violations.push({ file: relFile, line: startLine, kind: 'Markdown image missing alt' });
      }
    }
  }

  return { scanned, violations };
}

describe('docs image alt text', () => {
  const { scanned, violations } = collect();

  it('scans a meaningful number of images (guards against a vacuous pass)', () => {
    expect(scanned).toBeGreaterThan(200);
  });

  it('every image has non-empty alt text', () => {
    const report = violations.map(v => `${v.file}:${v.line}  ${v.kind}`).join('\n');
    expect(report).toBe('');
  });
});
