import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PAGES_DIR = path.join(DOCS_ROOT, 'pages');
const PUBLIC_DIR = path.join(DOCS_ROOT, 'public');

const ASSET_EXTENSIONS = /\.(png|webp|avif|jpe?g|gif|svg|mp4|webm|mov|diff)$/i;
const PROP_REF = /\b(src|darkSrc|source|darkSource|file|imageUrl)=("([^"]*)"|'([^']*)')/g;
const MARKDOWN_IMG = /!\[[^\]]*]\(([^\s)]+)/g;
const IMG_TAG_SRC = /<img\s[^>]*\bsrc=("([^"]*)"|'([^']*)')/gi;

interface AssetRef {
  file: string;
  line: number;
  prop: string;
  value: string;
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

function resolveToDiskPath(prop: string, rawValue: string): string | null {
  const value = rawValue.split(/[#?]/)[0];
  if (!value || value.includes('{')) {
    return null;
  }
  if (/^(?:https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('mailto:')) {
    return null;
  }
  if (!ASSET_EXTENSIONS.test(value)) {
    return null;
  }

  let webPath: string;
  if (prop === 'file' && !value.startsWith('/')) {
    webPath = `/static/videos/${value}`;
  } else if (value.startsWith('/static/')) {
    webPath = value;
  } else {
    return null;
  }

  return path.join(PUBLIC_DIR, webPath);
}

const dirEntriesCache = new Map<string, Set<string>>();

function readDirEntries(dir: string): Set<string> {
  let entries = dirEntriesCache.get(dir);
  if (!entries) {
    try {
      entries = new Set(fs.readdirSync(dir));
    } catch {
      entries = new Set();
    }
    dirEntriesCache.set(dir, entries);
  }
  return entries;
}

function existsWithExactCase(absPath: string): boolean {
  const relative = path.relative(PUBLIC_DIR, absPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return fs.existsSync(absPath);
  }
  let current = PUBLIC_DIR;
  for (const segment of relative.split(path.sep)) {
    if (!readDirEntries(current).has(segment)) {
      return false;
    }
    current = path.join(current, segment);
  }
  return true;
}

function collectAssetRefs(): { checked: AssetRef[]; broken: AssetRef[] } {
  const checked: AssetRef[] = [];
  const broken: AssetRef[] = [];

  for (const file of listMdxFiles(PAGES_DIR)) {
    const relFile = path.relative(DOCS_ROOT, file);
    const lines = blankCodeFences(fs.readFileSync(file, 'utf8')).split('\n');

    lines.forEach((line, index) => {
      const found: [string, string][] = [];
      let match: RegExpExecArray | null;

      PROP_REF.lastIndex = 0;
      while ((match = PROP_REF.exec(line))) {
        found.push([match[1], match[3] ?? match[4] ?? '']);
      }
      MARKDOWN_IMG.lastIndex = 0;
      while ((match = MARKDOWN_IMG.exec(line))) {
        found.push(['markdown', match[1]]);
      }
      IMG_TAG_SRC.lastIndex = 0;
      while ((match = IMG_TAG_SRC.exec(line))) {
        found.push(['img', match[2] ?? match[3] ?? '']);
      }

      for (const [prop, value] of found) {
        const diskPath = resolveToDiskPath(prop, value);
        if (!diskPath) {
          continue;
        }
        const ref: AssetRef = { file: relFile, line: index + 1, prop, value };
        checked.push(ref);
        if (!existsWithExactCase(diskPath)) {
          broken.push(ref);
        }
      }
    });
  }

  return { checked, broken };
}

describe('docs asset references', () => {
  const { checked, broken } = collectAssetRefs();

  it('scans a meaningful number of asset references (guards against a vacuous pass)', () => {
    expect(checked.length).toBeGreaterThan(500);
  });

  it('every asset referenced in .mdx pages exists in public/', () => {
    const report = broken
      .map(ref => `${ref.file}:${ref.line}  [${ref.prop}] ${ref.value}`)
      .join('\n');
    expect(report).toBe('');
  });
});
