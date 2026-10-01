/**
 * Packs the generated out/<path>/index.md pages into gzipped JSONL bundles for agent tools.
 *
 * Output in out/static/agents/:
 * - docs-shared.jsonl.gz: English pages outside versions/
 * - docs-vNN.0.0.jsonl.gz: pages of one SDK version
 * - index.json: bundle list with sha256 and page counts
 *
 * Each line is {"path","title","content"}. `path` is the site path without a trailing slash.
 *
 * Run after `pnpm generate-markdown-pages`. Usage: generate-docs-bundle.ts [outDir]
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { findMarkdownPages } from './generate-markdown-pages-utils.ts';

export type BundlePage = { path: string; title: string; content: string };

const VALID_PATH = /^[\dA-Za-z][\w./-]*$/;
const VERSION_DIR = /^versions\/(v\d+\.0\.0)\//;
const FRONTMATTER = /^---\n[\S\s]*?\n---\n/;
const AGENT_INSTRUCTIONS = /\n*<AgentInstructions>[\S\s]*?<\/AgentInstructions>\n*/g;
const MARKDOWN_BANNER = /^This documentation is available as Markdown for AI agents\b.*\n+/m;
const STUB_PREFIXES = ['This page redirects to', 'No content found'];
const SKIPPED_SECTIONS = ['ja/', 'internal/'];

export function pagePathFromFile(outDir: string, mdFile: string): string {
  const rel = path.relative(outDir, path.dirname(mdFile)).split(path.sep).join('/');
  return rel === '' ? 'index' : rel;
}

export function bundleNameForPath(pagePath: string): string | null {
  if (SKIPPED_SECTIONS.some(prefix => pagePath.startsWith(prefix))) {
    return null;
  }
  if (!pagePath.startsWith('versions/')) {
    return 'shared';
  }
  return pagePath.match(VERSION_DIR)?.[1] ?? null;
}

export function cleanPageMarkdown(markdown: string): string | null {
  const content = markdown
    .replace(AGENT_INSTRUCTIONS, '\n\n')
    .replace(MARKDOWN_BANNER, '')
    .replace(/^\n+/, '');
  const body = content.replace(FRONTMATTER, '').trimStart();
  return STUB_PREFIXES.some(prefix => body.startsWith(prefix)) ? null : content;
}

export function pageTitle(content: string): string {
  const frontmatter = content.match(FRONTMATTER)?.[0] ?? '';
  const title = frontmatter.match(/^title: *(.+)$/m)?.[1]?.trim();
  if (title) {
    return title.replace(/^(["'])(.*)\1$/, '$2');
  }
  return content.match(/^# +(.+)$/m)?.[1]?.trim() ?? '';
}

export function groupPages(pages: { path: string; markdown: string }[]): {
  bundles: Map<string, BundlePage[]>;
  invalidPaths: string[];
} {
  const bundles = new Map<string, BundlePage[]>();
  const invalidPaths: string[] = [];
  for (const page of pages) {
    const name = bundleNameForPath(page.path);
    const content = name ? cleanPageMarkdown(page.markdown) : null;
    if (!name || content === null) {
      continue;
    }
    if (!VALID_PATH.test(page.path)) {
      invalidPaths.push(page.path);
      continue;
    }
    const list = bundles.get(name) ?? [];
    list.push({ path: page.path, title: pageTitle(content), content });
    bundles.set(name, list);
  }
  for (const list of bundles.values()) {
    list.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }
  return {
    bundles: new Map([...bundles].sort(([a], [b]) => a.localeCompare(b))),
    invalidPaths,
  };
}

function main(outDir: string) {
  const pages = findMarkdownPages(outDir).map(file => ({
    path: pagePathFromFile(outDir, file),
    markdown: fs.readFileSync(file, 'utf-8'),
  }));
  const { bundles, invalidPaths } = groupPages(pages);
  if (invalidPaths.length > 0) {
    console.error(`\x1b[31m✗\x1b[0m Invalid page paths:\n${invalidPaths.join('\n')}`);
    process.exit(1);
  }

  const agentsDir = path.join(outDir, 'static', 'agents');
  fs.rmSync(agentsDir, { recursive: true, force: true });
  fs.mkdirSync(agentsDir, { recursive: true });

  const { version, betaVersion } = JSON.parse(
    fs.readFileSync(path.join(outDir, '..', 'package.json'), 'utf-8')
  );
  const index = {
    format: 1,
    generatedAt: new Date().toISOString(),
    latest: `v${version}`,
    beta: betaVersion ? `v${betaVersion}` : null,
    bundles: {} as Record<string, { file: string; sha256: string; pages: number }>,
  };
  for (const [name, list] of bundles) {
    const file = `docs-${name}.jsonl.gz`;
    const jsonl = list.map(page => JSON.stringify(page) + '\n').join('');
    const gz = gzipSync(jsonl, { level: 9 });
    fs.writeFileSync(path.join(agentsDir, file), gz);
    const sha256 = createHash('sha256').update(gz).digest('hex');
    index.bundles[name] = { file, sha256, pages: list.length };
    console.warn(` \x1b[2m⧖\x1b[0m ${file}: ${list.length} pages, ${gz.length} bytes`);
  }
  fs.writeFileSync(path.join(agentsDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  console.warn(` \x1b[1m\x1b[32m✓\x1b[0m Generated ${bundles.size} docs bundles in ${agentsDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(path.resolve(process.argv[2] ?? 'out'));
}
