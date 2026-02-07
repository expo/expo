/**
 * Generates per-page markdown files in out/ for Accept: text/markdown content negotiation.
 *
 * Converts the rendered HTML from `next build` to markdown with cheerio + turndown.
 * This automatically handles all custom MDX components (APISection,
 * ConfigPluginProperties, etc.) since they're already rendered in the HTML.
 *
 * Run after `next build` so the out/ directory exists with all published HTML pages.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  checkMarkdownQuality,
  convertHtmlToMarkdown,
  findHtmlPages,
} from './generate-markdown-pages-utils.ts';

const OUT_DIR = path.join(process.cwd(), 'out');

if (!fs.existsSync(OUT_DIR)) {
  console.error('out/ directory not found. Run `next build` first.');
  process.exit(1);
}

let generated = 0;
let skipped = 0;
let warned = 0;

for (const htmlPath of findHtmlPages(OUT_DIR)) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const markdown = convertHtmlToMarkdown(html);
  if (!markdown) {
    skipped++;
    continue;
  }

  const rel = path.relative(OUT_DIR, htmlPath);
  const warnings = checkMarkdownQuality(markdown, rel);
  if (warnings.length) {
    for (const w of warnings) {
      console.warn(`  \x1b[33m⚠\x1b[0m ${rel}: ${w}`);
    }
    warned++;
  }

  const mdPath = path.join(path.dirname(htmlPath), 'index.md');
  fs.writeFileSync(mdPath, markdown);
  generated++;
}

console.log(
  ` \x1b[1m\x1b[32m✓\x1b[0m Generated ${generated} markdown pages (${skipped} skipped${warned ? `, ${warned} with warnings` : ''})`
);
