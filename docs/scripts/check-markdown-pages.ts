/**
 * Post-build quality check for generated markdown pages.
 *
 * Runs after `generate-markdown-pages` to verify that the markdown conversion
 * produced reasonable output. Exits non-zero if any page fails structural checks,
 * which will fail CI.
 *
 * Checks (via checkPage in generate-markdown-pages-utils.ts):
 * - Every .md file has at least one heading
 * - No raw HTML tags (<div>, <span>) leaked through (outside code blocks)
 * - No CSS class names appear in the text (outside code blocks)
 * - Code block fences are balanced
 * - No empty files
 * - Minimum page count (content-loss detection)
 */

import fs from 'node:fs';
import path from 'node:path';

import { checkPage, findHtmlPages, findMarkdownPages } from './generate-markdown-pages-utils.ts';

const OUT_DIR = path.join(process.cwd(), 'out');

if (!fs.existsSync(OUT_DIR)) {
  console.error('out/ directory not found. Run `next build` first.');
  process.exit(1);
}

const htmlFiles = findHtmlPages(OUT_DIR);
const mdFiles = findMarkdownPages(OUT_DIR);

if (mdFiles.length === 0) {
  console.error('No markdown files found in out/. Did generate-markdown-pages run?');
  process.exit(1);
}

// Every HTML page should have a corresponding markdown file.
if (mdFiles.length !== htmlFiles.length) {
  console.error(
    `\n \x1b[1m\x1b[31m✗\x1b[0m Markdown/HTML count mismatch: ${mdFiles.length} markdown files for ${htmlFiles.length} HTML pages`
  );
  process.exit(1);
}

let failCount = 0;

for (const mdPath of mdFiles) {
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const rel = path.relative(OUT_DIR, mdPath);
  const htmlRel = rel.replace(/\.md$/, '.html');
  const errors = checkPage(markdown, htmlRel);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`  \x1b[31m✗\x1b[0m ${rel}: ${error}`);
    }
    failCount++;
  }
}

if (failCount) {
  console.error(
    `\n \x1b[1m\x1b[31m✗\x1b[0m ${failCount} of ${mdFiles.length} markdown pages have quality issues`
  );
  process.exit(1);
} else {
  console.warn(
    ` \x1b[1m\x1b[32m✓\x1b[0m All ${mdFiles.length} markdown pages passed quality checks`
  );
}
