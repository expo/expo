/**
 * Post-build quality check for generated markdown pages.
 *
 * Runs after `generate-markdown-pages` to verify that the markdown conversion
 * produced reasonable output. Exits non-zero if any page fails structural checks,
 * which will fail CI.
 *
 * Checks (via checkPage in generate-markdown-pages-utils.js):
 * - Every .md file has at least one heading
 * - No raw HTML tags (<div>, <span>) leaked through (outside code blocks)
 * - No CSS class names appear in the text (outside code blocks)
 * - Code block fences are balanced
 * - No empty files
 * - Minimum page count (content-loss detection)
 */

import fs from 'node:fs';
import path from 'node:path';

import { checkPage } from './generate-markdown-pages-utils.js';

const OUT_DIR = path.join(process.cwd(), 'out');

// Minimum expected number of markdown pages. If fewer are generated, something
// is likely broken in the build pipeline. Update this when the docs grow.
const MIN_EXPECTED_PAGES = 100;

if (!fs.existsSync(OUT_DIR)) {
  console.error('out/ directory not found. Run `next build` first.');
  process.exit(1);
}

function findMarkdownPages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next' || entry.name === 'static') continue;
      results.push(...findMarkdownPages(fullPath));
    } else if (entry.name === 'index.md') {
      results.push(fullPath);
    }
  }
  return results;
}

const mdFiles = findMarkdownPages(OUT_DIR);

if (mdFiles.length === 0) {
  console.error('No markdown files found in out/. Did generate-markdown-pages run?');
  process.exit(1);
}

if (mdFiles.length < MIN_EXPECTED_PAGES) {
  console.error(
    `\n \x1b[1m\x1b[31m✗\x1b[0m Only ${mdFiles.length} markdown pages found (expected at least ${MIN_EXPECTED_PAGES}). Possible content loss.`
  );
  process.exit(1);
}

let failCount = 0;

for (const mdPath of mdFiles) {
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const errors = checkPage(markdown);
  if (errors.length) {
    const rel = path.relative(OUT_DIR, mdPath);
    for (const e of errors) {
      console.error(`  \x1b[31m✗\x1b[0m ${rel}: ${e}`);
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
  console.log(
    ` \x1b[1m\x1b[32m✓\x1b[0m All ${mdFiles.length} markdown pages passed quality checks`
  );
}
