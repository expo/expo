import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LINK_PROTOCOL_ALLOWLIST } from './link-protocol-allowlist.ts';

const DOCS_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PAGES_DIR = path.join(DOCS_ROOT, 'pages');

const MARKDOWN_LINK = /]\(\s*<?([^\s)>]+)/g;
const ATTR_URL = /\b(?:href|src)=("([^"]*)"|'([^']*)')/g;
const AUTOLINK = /<((?:https?:)?\/\/[^\s"'>`]+)>/g;
const ALLOW_HTTP_DIRECTIVE = /{\/\*\s*allow-http:\s*\S.*?\*\/}/;

interface Violation {
  file: string;
  line: number;
  url: string;
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

function insecureHost(url: string): string | null {
  let rest: string;
  if (url.startsWith('http://')) {
    rest = url.slice('http://'.length);
  } else if (url.startsWith('//')) {
    rest = url.slice('//'.length);
  } else {
    return null;
  }
  const host = rest.split(/[#/?]/)[0];
  return host || null;
}

function isAllowedHost(host: string): boolean {
  const withoutPort = host.replace(/:\d+$/, '');
  return LINK_PROTOCOL_ALLOWLIST.hosts.some(re => re.test(host) || re.test(withoutPort));
}

function collect(): { scannedAbsolute: number; violations: Violation[] } {
  let scannedAbsolute = 0;
  const violations: Violation[] = [];
  const allowedUrls = new Set(LINK_PROTOCOL_ALLOWLIST.urls);

  for (const file of listMdxFiles(PAGES_DIR)) {
    const relFile = path.relative(DOCS_ROOT, file);
    if (LINK_PROTOCOL_ALLOWLIST.ignorePaths.some(prefix => relFile.startsWith(prefix))) {
      continue;
    }
    const lines = blankCodeFences(fs.readFileSync(file, 'utf8')).split('\n');

    lines.forEach((line, index) => {
      const urls: string[] = [];
      let match: RegExpExecArray | null;

      MARKDOWN_LINK.lastIndex = 0;
      while ((match = MARKDOWN_LINK.exec(line))) {
        urls.push(match[1]);
      }
      ATTR_URL.lastIndex = 0;
      while ((match = ATTR_URL.exec(line))) {
        urls.push(match[2] ?? match[3] ?? '');
      }
      AUTOLINK.lastIndex = 0;
      while ((match = AUTOLINK.exec(line))) {
        urls.push(match[1]);
      }

      const exempt =
        ALLOW_HTTP_DIRECTIVE.test(line) ||
        (index > 0 && ALLOW_HTTP_DIRECTIVE.test(lines[index - 1]));

      for (const url of urls) {
        if (!url) {
          continue;
        }
        if (/^(?:https?:)?\/\//.test(url)) {
          scannedAbsolute++;
        }
        const host = insecureHost(url);
        if (!host || isAllowedHost(host) || allowedUrls.has(url) || exempt) {
          continue;
        }
        violations.push({ file: relFile, line: index + 1, url });
      }
    });
  }

  return { scannedAbsolute, violations };
}

describe('docs link protocol', () => {
  const { scannedAbsolute, violations } = collect();

  it('scans a meaningful number of links (guards against a vacuous pass)', () => {
    expect(scannedAbsolute).toBeGreaterThan(100);
  });

  it('no insecure (http / protocol-relative) links outside the allowlist', () => {
    const report = violations.map(v => `${v.file}:${v.line}  ${v.url}`).join('\n');
    expect(report).toBe('');
  });
});
