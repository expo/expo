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
 *
 * Integration test (pages/internal/test-markdown-pipeline.mdx):
 * - If the dev server is running on localhost:3002, fetches the page and converts
 *   HTML→Markdown live, then validates the output.
 * - Otherwise, checks out/internal/test-markdown-pipeline/index.md if it exists.
 * - Validates that key content survived conversion and no artifacts leaked through.
 */

import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

import {
  checkPage,
  convertHtmlToMarkdown,
  extractFrontmatter,
  findHtmlPages,
  findMarkdownPages,
  findMdxSource,
} from './generate-markdown-pages-utils.ts';

const OUT_DIR = path.join(process.cwd(), 'out');
const PAGES_DIR = path.join(process.cwd(), 'pages');

let failCount = 0;

/**
 * Every <Tab label="..."> in the source MDX must survive into the generated
 * markdown as a heading. Guards against silent content loss when a multi-panel
 * component is stripped during HTML→Markdown conversion (ENG-21907).
 */
function findMissingTabLabels(markdown: string, mdxPath: string): string[] {
  const mdx = fs.readFileSync(mdxPath, 'utf-8');
  const labelRegex = /<Tab\s+label=(?:"([^"]*)"|'([^']*)')/g;
  const missing: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = labelRegex.exec(mdx)) !== null) {
    const label = (match[1] ?? match[2] ?? '').trim();
    if (label && !markdown.includes(label)) {
      missing.push(label);
    }
  }
  return missing;
}

/**
 * Structural backstop for tab content loss, independent of how labels are
 * declared. The conversion prefixes every rendered tab panel with its label as
 * an h4, so the markdown must hold at least as many h4 headings as the built
 * HTML has tab panels. A shortfall means panels were dropped. Covers the
 * <Tabs tabs={[...]}> prop style and dynamic labels, which the source-MDX check
 * above cannot see (ENG-21907). Returns the number of missing headings.
 */
function tabPanelHeadingDeficit(markdown: string, htmlPath: string): number {
  if (!fs.existsSync(htmlPath)) {
    return 0;
  }
  const html = fs.readFileSync(htmlPath, 'utf-8');
  if (!html.includes('data-reach-tab')) {
    return 0;
  }
  const panels = cheerio.load(html)('[data-reach-tab-panel]').length;
  if (panels === 0) {
    return 0;
  }
  const headings = (markdown.match(/^#### /gm) ?? []).length;
  return Math.max(0, panels - headings);
}

// --- Bulk quality gate (requires out/ from a full build) ---

if (fs.existsSync(OUT_DIR)) {
  const htmlFiles = findHtmlPages(OUT_DIR);
  const mdFiles = findMarkdownPages(OUT_DIR);

  if (mdFiles.length === 0) {
    console.error('No markdown files found in out/. Did generate-markdown-pages run?');
    process.exit(1);
  }

  if (mdFiles.length !== htmlFiles.length) {
    console.error(
      `\n \x1b[1m\x1b[31m✗\x1b[0m Markdown/HTML count mismatch: ${mdFiles.length} markdown files for ${htmlFiles.length} HTML pages`
    );
    process.exit(1);
  }

  for (const mdPath of mdFiles) {
    const markdown = fs.readFileSync(mdPath, 'utf-8');
    const rel = path.relative(OUT_DIR, mdPath);
    const htmlRel = rel.replace(/\.md$/, '.html');
    const errors = checkPage(markdown, htmlRel);

    const mdxPath = findMdxSource(mdPath, OUT_DIR, PAGES_DIR);
    if (mdxPath) {
      const missingLabels = findMissingTabLabels(markdown, mdxPath);
      for (const label of missingLabels) {
        errors.push(`Tab "${label}" from source MDX is missing (content dropped)`);
      }
    }

    const htmlPath = path.join(OUT_DIR, htmlRel);
    const deficit = tabPanelHeadingDeficit(markdown, htmlPath);
    if (deficit > 0) {
      errors.push(`${deficit} tab panel(s) dropped: fewer h4 headings than rendered tab panels`);
    }

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
  } else {
    console.warn(
      ` \x1b[1m\x1b[32m✓\x1b[0m All ${mdFiles.length} markdown pages passed quality checks`
    );
  }
}

// --- Integration test for test-markdown-pipeline page ---

const INTEGRATION_TEST_SLUG = 'internal/test-markdown-pipeline';
const DEV_SERVER_URL = `http://localhost:3002/${INTEGRATION_TEST_SLUG}/`;

async function getIntegrationTestMarkdownAsync(): Promise<string | null> {
  // Try the dev server first
  try {
    const response = await fetch(DEV_SERVER_URL, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const html = await response.text();
      const mdxPath = path.join(process.cwd(), 'pages', INTEGRATION_TEST_SLUG + '.mdx');
      const frontmatter = fs.existsSync(mdxPath) ? extractFrontmatter(mdxPath) : null;
      const markdown = convertHtmlToMarkdown(html);
      return frontmatter ? frontmatter + '\n' + markdown : markdown;
    }
  } catch {
    // Dev server not running or page not found — fall through
  }

  // Fall back to pre-built markdown in out/
  const outPath = path.join(OUT_DIR, INTEGRATION_TEST_SLUG, 'index.md');
  if (fs.existsSync(outPath)) {
    return fs.readFileSync(outPath, 'utf-8');
  }

  return null;
}

const integrationMd = await getIntegrationTestMarkdownAsync();

if (integrationMd === null) {
  if (!fs.existsSync(OUT_DIR)) {
    console.warn(
      ' \x1b[33m⚠\x1b[0m No out/ directory and dev server not running — skipping all checks'
    );
  } else {
    console.warn(' \x1b[33m⚠\x1b[0m Integration test page not found — skipping integration test');
  }
} else {
  const errors: string[] = [];

  // Positive: content must survive conversion
  const mustContain: [string, string][] = [
    ['terminal command', 'npx expo-md-test@latest'],
    ['collapsible content', 'md-test-collapsible-content'],
    ['step one', 'md-test-step-one'],
    ['step two', 'md-test-step-two'],
    ['boxlink title', 'md-test-boxlink-title'],
    ['callout', 'md-test-callout-info'],
    ['typed code', 'md-test-typed-code'],
    ['table cell', 'md-test-table-cell'],
    ['link text', 'md-test-link-text'],
    ['bold text', 'md-test-bold-text'],
    ['unordered list', 'md-test-unordered-item'],
    ['ordered list', 'md-test-ordered-item'],
    ['first tab label', 'md-test-tab-one-label'],
    ['first tab content', 'md-test-tab-one-pkg'],
    ['second tab label', 'md-test-tab-two-label'],
    ['second tab content', 'md-test-tab-two-pkg'],
  ];
  for (const [label, text] of mustContain) {
    if (!integrationMd.includes(text)) {
      errors.push(`Missing ${label}: "${text}"`);
    }
  }

  // Negative: artifacts must not leak
  if (/^Terminal$/m.test(integrationMd)) {
    errors.push('Snippet header "Terminal" label leaked as standalone text');
  }

  // Structural checks (reuse existing quality gate)
  const pageErrors = checkPage(integrationMd, `${INTEGRATION_TEST_SLUG}/index.html`);
  errors.push(...pageErrors);

  if (errors.length > 0) {
    console.error('\n  Integration test page validation failed:');
    for (const error of errors) {
      console.error(`    \x1b[31m✗\x1b[0m ${error}`);
    }
    failCount++;
  } else {
    console.warn(' \x1b[1m\x1b[32m✓\x1b[0m Integration test page passed');
  }
}

if (failCount) {
  process.exit(1);
}
