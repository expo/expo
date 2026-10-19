import GithubSlugger from 'github-slugger';
import fs from 'node:fs';
import path from 'node:path';

import { generateSlug } from '~/common/utilities';

import { DOCS_ROOT, JA_DIR, listJaPages, relKey } from './sync.ts';

/**
 * Anchors that point from one translated page to another are the ones that rot when a
 * heading gets translated: the link keeps the English fragment while the heading now
 * generates a Japanese id. Links into English pages are out of scope — their headings can
 * also come from generated API data, which this file cannot resolve.
 */
type AnchorLink = {
  file: string;
  line: number;
  targetPath: string;
  fragment: string;
};

function collectJaToJaAnchors(): AnchorLink[] {
  const links: AnchorLink[] = [];
  for (const jaPath of listJaPages()) {
    const source = fs.readFileSync(jaPath, 'utf8');
    for (const match of source.matchAll(/]\((\/ja\/[^\s)]*)#([^\s)]+)\)/g)) {
      links.push({
        file: `pages/ja/${relKey(jaPath)}`,
        line: source.slice(0, match.index).split('\n').length,
        targetPath: match[1].replace(/\/$/, ''),
        fragment: decodeURIComponent(match[2]),
      });
    }
  }
  return links;
}

/**
 * Every id the target page registers, in document order. Markdown headings drive the
 * common case; `Collapsible` and `Requirement` register ids too, so they count as well.
 * `Prerequisites` registers a fixed `prerequisites` anchor rather than one derived from
 * its text, so it stays the same in every locale.
 */
function headingIds(mdxPath: string): Set<string> {
  const slugger = new GithubSlugger();
  const ids = new Set<string>();
  for (const line of fs.readFileSync(mdxPath, 'utf8').split('\n')) {
    if (line.includes('<Prerequisites')) {
      ids.add('prerequisites');
    }
    const heading = line.match(/^#{2,5}\s+(.*)$/);
    const summary = line.match(/<Collapsible\s+summary="([^"]+)"/);
    const title = heading?.[1] ?? summary?.[1];
    if (title) {
      ids.add(generateSlug(slugger, title.trim()));
    }
  }
  return ids;
}

describe('docs ja anchor links', () => {
  const links = collectJaToJaAnchors();

  it('scans the ja-to-ja anchors (guards against a vacuous pass)', () => {
    expect(links.length).toBeGreaterThan(0);
  });

  it('every anchor points at a heading that exists', () => {
    const broken = links.filter(link => {
      const target = path.join(JA_DIR, `${link.targetPath.replace('/ja/', '')}.mdx`);
      if (!fs.existsSync(target)) {
        return true;
      }
      return !headingIds(target).has(link.fragment);
    });
    const report = broken
      .map(
        link =>
          `${link.file}:${link.line}  ${link.targetPath}#${link.fragment}  (no such heading in ${path.relative(DOCS_ROOT, path.join(JA_DIR, `${link.targetPath.replace('/ja/', '')}.mdx`))})`
      )
      .join('\n');
    expect(report).toBe('');
  });
});
