import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Find the MDX source file corresponding to an output HTML path.
 * Returns the absolute path to the .mdx file, or null if not found.
 *
 * Mapping: out/a/b/c/index.html → pages/a/b/c.mdx or pages/a/b/c/index.mdx
 */
export function findMdxSource(htmlPath: string, outDir: string, pagesDir: string): string | null {
  const rel = path.relative(outDir, path.dirname(htmlPath)); // e.g. "versions/v55.0.0/sdk/camera"
  const candidates = [
    path.join(pagesDir, rel + '.mdx'),
    path.join(pagesDir, rel, 'index.mdx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Extract the raw YAML frontmatter block (including --- delimiters) from an MDX file.
 * Returns the frontmatter string with trailing newline, or null if no frontmatter found.
 */
export function extractFrontmatter(mdxPath: string): string | null {
  const content = fs.readFileSync(mdxPath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?\n)---\n/);
  if (!match) {
    return null;
  }
  return match[0];
}

function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  turndown.use(gfm);

  // Ensure pre>code blocks are rendered as fenced code blocks
  turndown.addRule('codeBlocks', {
    filter: (node: HTMLElement) => node.nodeName === 'PRE' && !!node.querySelector('code'),
    replacement: (_content: string, node: HTMLElement) => {
      const code = node.querySelector('code') as HTMLElement;
      const lang =
        node.getAttribute('data-md-lang') ?? code.className?.match(/language-(\w+)/)?.[1] ?? '';
      const text = code.textContent ?? '';
      return `\n\n\`\`\`${lang}\n${text.trim()}\n\`\`\`\n\n`;
    },
  });

  // Remove images — they reference local/CDN paths that won't work in plain markdown
  turndown.addRule('images', {
    filter: 'img',
    replacement: () => '',
  });

  return turndown;
}

const turndown = createTurndownService();

/**
 * Recursively find all index.html files in a directory, skipping internal directories.
 */
export function findHtmlPages(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next' || entry.name === 'static') {
        continue;
      }
      results.push(...findHtmlPages(fullPath));
    } else if (entry.name === 'index.html') {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Recursively find all index.md files in a directory, skipping internal directories.
 */
export function findMarkdownPages(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next' || entry.name === 'static') {
        continue;
      }
      results.push(...findMarkdownPages(fullPath));
    } else if (entry.name === 'index.md') {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Clean up the HTML before conversion: remove non-content elements,
 * normalize terminal blocks, and strip decorative artifacts.
 */
export function cleanHtml($: CheerioAPI, main: Cheerio<AnyNode>): void {
  // Remove interactive/decorative elements
  main.find('button').remove();

  // Preserve semantic SVG icons as text before blanket SVG removal.
  // YesIcon (text-icon-success) → ✓, NoIcon (text-icon-danger) → ✗
  main.find('svg').each((_, el) => {
    const $svg = $(el);
    const cls = $svg.attr('class') ?? '';
    if (cls.includes('text-icon-success')) {
      $svg.replaceWith('✓');
    } else if (cls.includes('text-icon-danger')) {
      $svg.replaceWith('✗');
    }
  });
  main.find('svg').remove();

  // Remove hidden code spans that contain %%placeholder%% markers and collapsed imports.
  // These leak into text content if not removed before turndown processes the HTML.
  main.find('.code-hidden').remove();

  // Remove "Edit page" / "Report an issue" links.
  // Primary removal is via data-md="skip" on PageTitleButtons; this is the fallback
  // for any remaining text-matched links that lack the attribute.
  main.find('a').each((_, el) => {
    const text = $(el).text().trim();
    if (text === 'Edit page' || text === 'Report an issue') {
      $(el).parent().remove();
    }
  });

  // Convert font-semibold spans to <strong> so Turndown produces bold text.
  main.find('span.font-semibold').each((_, el) => {
    const $el = $(el);
    $el.replaceWith('<strong>' + $el.html() + '</strong>');
  });

  // Convert API platform tag groups to "Supported platforms: X, Y" text.
  main.find('[data-md="api-platforms"]').each((_, el) => {
    const $el = $(el);
    const platforms: string[] = [];
    $el.find('[data-md="platform-badge"]').each((_, badge) => {
      const text = $(badge).find('span').last().text().trim();
      if (text) {
        platforms.push(text);
      }
    });
    if (platforms.length > 0) {
      $el.replaceWith('<p>Supported platforms: ' + platforms.join(', ') + '.</p>');
    } else {
      $el.remove();
    }
  });

  // Extract platform text from badge elements BEFORE removing skip/select-none elements.
  // data-md="platform-badge" is the stable marker; fallback matches .select-none.rounded-full.border.
  main.find('[data-md="platform-badge"]').each((_, el) => {
    const $el = $(el);
    // Inside headings, remove the badge entirely — the heading text already contains
    // the platform name, so replacing would duplicate it (e.g. "### Android Android").
    if ($el.closest('h1, h2, h3, h4, h5, h6').length > 0) {
      $el.remove();
      return;
    }
    const platformText = $el.find('span').last().text().trim();
    if (platformText) {
      $el.replaceWith(`, ${platformText}`);
    }
  });
  // Fallback: extract platform badges that lack data-md but have the old CSS class pattern
  main.find('.select-none').each((_, el) => {
    const $el = $(el);
    const cls = $el.attr('class') ?? '';
    if (cls.includes('rounded-full') && cls.includes('border')) {
      if ($el.closest('h1, h2, h3, h4, h5, h6').length > 0) {
        $el.remove();
        return;
      }
      const platformText = $el.find('span').last().text().trim();
      if (platformText) {
        $el.replaceWith(`, ${platformText}`);
      }
    }
  });

  // Remove decorative/non-content elements marked for skipping (prompt chars, comments, etc).
  // data-md="skip" is the stable marker; .select-none is the fallback for unmarked elements.
  main.find('[data-md="skip"]').remove();
  main.find('.select-none').remove();

  // Flatten card links into simple "<a>title</a> — description" so turndown produces
  // clean inline links. data-md="card-link" is the stable marker; the fallback matches
  // any <a> containing block-level <div> content with data-text children.
  //
  // Note: data-text="true" is set by ui/components/Text/index.tsx on all crawlable text
  // elements (span, p, li, blockquote, code, pre). It's core infrastructure, not fragile.
  main.find('[data-md="card-link"], a:has(div)').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href) {
      return;
    }
    const texts: string[] = [];
    $a.find('[data-text="true"]').each((_, textEl) => {
      const t = $(textEl).text().trim();
      if (t) {
        texts.push(t);
      }
    });
    if (texts.length > 0) {
      const title = texts[0];
      const desc = texts.slice(1).join(' — ');
      const replacement = desc
        ? `<p><a href="${href}">${title}</a> — ${desc}</p>`
        : `<p><a href="${href}">${title}</a></p>`;
      $a.replaceWith(replacement);
    }
  });

  // Remove snippet headers (file labels, "Terminal" labels above code blocks).
  // data-md="snippet-header" is the stable marker (from SnippetHeader component).
  main.find('[data-md="snippet-header"]').remove();

  // Remove orphaned step numbers: replace step containers with just the content.
  // data-md="step" is the stable marker; the fallback matches div.flex.gap-4 with
  // exactly 2 children where the first is a 1-2 digit number.
  main.find('[data-md="step"]').each((_, el) => {
    const $div = $(el);
    const content = $div.find('[data-md="step-content"]');
    if (content.length > 0) {
      $div.replaceWith(content.html()!);
      return;
    }
    // Fallback: unwrap second child
    const children = $div.children();
    if (children.length >= 2) {
      $div.replaceWith($(children[1]).html()!);
    }
  });
  // Fallback for steps without data-md attributes
  main.find('div').each((_, el) => {
    const $div = $(el);
    if ($div.attr('data-md')) {
      return;
    } // Already handled
    const cls = $div.attr('class') ?? '';
    if (!cls.includes('flex') || !cls.includes('gap-4')) {
      return;
    }
    const children = $div.children();
    if (children.length !== 2) {
      return;
    }
    const first = $(children[0]);
    const second = $(children[1]);
    const firstText = first.text().trim();
    if (/^\d{1,2}$/.test(firstText) && second.prop('tagName') === 'DIV') {
      $div.replaceWith(second.html()!);
    }
  });

  // Convert API returns sections to inline "Returns: type" text.
  main.find('[data-md="api-returns"]').each((_, el) => {
    const $el = $(el);
    const codeEl = $el.find('code').first();
    const typeText =
      codeEl.length > 0 ? codeEl.text().trim() : $el.text().replace('Returns:', '').trim();
    if (typeText) {
      $el.replaceWith('<p>Returns: <code>' + typeText + '</code></p>');
    }
  });

  // Convert API parameter name spans to <code> for backtick formatting.
  main.find('[data-md="api-param-name"]').each((_, el) => {
    const $el = $(el);
    $el.replaceWith('<code>' + $el.text() + '</code>');
  });

  // Unwrap <code> elements that contain links so the links render in markdown.
  // Turndown converts <code> to backticks which escapes markdown link syntax inside,
  // so we remove the <code> wrapper and let the inner content (links + text) stand alone.
  main.find('code:has(a)').each((_, el) => {
    const $code = $(el);
    $code.replaceWith($code.html() ?? '');
  });

  // Flatten block elements inside table cells to prevent newlines breaking markdown tables.
  // Turndown converts <p>, <div>, and <blockquote> to blocks with newlines, which breaks
  // GFM table syntax.
  //
  // Strategy: first handle data-md annotated elements with known semantics, then loop
  // generic block flattening until no block elements remain (nested divs require multiple
  // passes because cheerio's .find() snapshot misses children revealed by parent unwrapping).
  main.find('td, th').each((_, cell) => {
    const $cell = $(cell);

    // data-md="callout" — inline the callout text (e.g. deprecation warnings).
    // The callout's visible text (like "Deprecated: use X instead") is already meaningful;
    // just extract it and drop the blockquote/svg/div wrapper structure.
    // Target the <p> inside the callout to avoid picking up SVG alt text.
    $cell.find('[data-md="callout"]').each((_, el) => {
      const text = $(el).find('p').first().text().trim();
      $(el).replaceWith(text ? text + ' ' : '');
    });

    // Generic block flattening — loop until stable since nested divs require multiple passes.
    // Prepend ". " when unwrapping so adjacent blocks read as separate sentences, then
    // clean up artifacts (double periods, leading separators) after the loop.
    let hasBlocks = true;
    while (hasBlocks) {
      hasBlocks = false;
      $cell.find('blockquote').each((_, el) => {
        $(el).replaceWith('. ' + $(el).text().trim());
        hasBlocks = true;
      });
      $cell.find('p').each((_, el) => {
        $(el).replaceWith('. ' + ($(el).html() ?? ''));
        hasBlocks = true;
      });
      $cell.find('div').each((_, el) => {
        $(el).replaceWith('. ' + ($(el).html() ?? ''));
        hasBlocks = true;
      });
    }
    // Clean up artifacts from block flattening:
    // - Collapse ". ." / ".." from nested unwrapping
    // - Trim leading ". " at cell start
    // - Remove orphan "-" after periods (upstream renders a bare dash for empty descriptions)
    const cellHtml = $cell
      .html()!
      .replace(/\.\s*\.\s*/g, '. ')
      .replace(/^\s*\.\s*/, '')
      .replace(/\.\s*-\s*$/, '.');
    $cell.html(cellHtml);
  });

  // Convert diff tables to fenced diff code blocks.
  // data-md="diff" is the stable marker on the DiffBlock wrapper; table.diff is the fallback
  // (class="diff" comes from the react-diff-view library).
  main.find('[data-md="diff"] table, table.diff').each((_, el) => {
    const $table = $(el);
    const lines: string[] = [];
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const codeCell = $row.find('td').last();
      const text = codeCell.text().trim();
      if (text) {
        lines.push(text);
      }
    });
    if (lines.length > 0) {
      $table.replaceWith(`<pre><code class="language-diff">${lines.join('\n')}</code></pre>`);
    }
  });

  // Convert terminal-style code blocks to proper <pre><code>.
  // data-md="code-block" is the stable marker; bg-palette-black is the fallback.
  main.find('[data-md="code-block"], [class*="bg-palette-black"]').each((_, el) => {
    const $el = $(el);
    const codeTexts: string[] = [];
    $el.find('code').each((_, code) => {
      const text = $(code).text().trim();
      if (text) {
        codeTexts.push(text);
      }
    });
    if (codeTexts.length > 0) {
      $el.replaceWith(`<pre><code class="language-sh">${codeTexts.join('\n')}</code></pre>`);
    }
  });
}

/**
 * Post-process the markdown output to clean up common artifacts.
 *
 * Related markdown cleanup in other pipelines (they operate on MDX source, not rendered HTML):
 * - scripts/generate-llms/utils.js cleanContent()
 * - ui/components/MarkdownActions/processMarkdown.ts
 */
export function cleanMarkdown(markdown: string): string {
  return (
    markdown
      // Remove anchor links in headings: ## Title[](#title) → ## Title
      .replace(/(#{1,6}\s+.+?)\[]\(#[^)]+\)/g, '$1')
      // Remove empty links: [](url) — leftover from icon-only links after SVG removal
      .replace(/\[]\([^)]+\)/g, '')
      // Remove standalone horizontal rules (often from description separators)
      .replace(/^\* \* \*$/gm, '')
      // Replace %%placeholder%% markers with ellipsis
      .replace(/%%placeholder-start%%.*?%%placeholder-end%%/g, '...')
      // Clean up platform badge comma formatting
      .replace(/Only for:\s*,\s*/g, 'Only for: ')
      .replace(/^\s*,\s*/gm, '')
      .replace(/(Only for:\s+.+?)\s+,\s*/g, '$1, ')
      // Strip orphan commas before platform names (from badge replacement)
      // but not between platform names like "iOS, Android" in "Only for:" lists
      .replace(/(?<=\s), (Android|iOS|Web|tvOS|macOS)\b/g, '$1')
      // Remove bullet separators from Experimental/Deprecated badge lines
      .replace(/^(Experimental|Deprecated)\s*\u2022\s*$/gm, '$1')
      // Add space between Default: and backtick-quoted value
      .replace(/Default:`/g, 'Default: `')
      // Fix run-together "sentence.Deprecated" text
      .replace(/\.Deprecated/g, '. Deprecated')
      // Unescape dashes that turndown escapes to prevent list interpretation
      .replace(/\\-/g, '-')
      // Unescape underscores that turndown escapes to prevent italic interpretation
      .replace(/\\_/g, '_')
      // Unescape square brackets that turndown escapes to prevent link interpretation.
      // Only unescape \[...\] sequences that are NOT followed by (...) link targets.
      .replace(/\\\[([^\]]*?)\\](?!\()/g, '[$1]')
      // Remove orphaned bullet markers (from platform tag separators)
      .replace(/^\s*•\s*$/gm, '')
      // Replace fullwidth equals sign with regular equals
      .replace(/\uff1d/g, '=')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Strip fenced code blocks from markdown so quality checks don't false-positive
 * on code examples (e.g. React docs teaching <div>, CSS class name references).
 */
export function stripCodeBlocks(markdown: string): string {
  return markdown.replace(/^```[^\n]*\n[\S\s]*?^```$/gm, '');
}

/**
 * Pages where specific warnings are expected and should be suppressed.
 *
 * - Section landing pages (build/, eas/hosting/) render only a title -- legitimately short.
 * - Pages that teach about HTML elements (faq/, dom-components/, static-rendering/, workflow/web/)
 *   mention <div>, <span>, etc. in inline code which isn't stripped by stripCodeBlocks.
 */
const KNOWN_WARNING_EXEMPTIONS = {
  'build/index.html': ['Suspiciously short'],
  'eas/hosting/index.html': ['Suspiciously short'],
  'faq/index.html': ['Contains raw HTML tags'],
  'guides/dom-components/index.html': ['Contains raw HTML tags'],
  'router/web/static-rendering/index.html': ['Contains raw HTML tags'],
  'workflow/web/index.html': ['Contains raw HTML tags'],
};

/**
 * Check generated markdown for quality issues that suggest a conversion problem.
 * Returns an array of warning strings (empty if no issues).
 * Used during generation to log non-blocking warnings.
 *
 * @param pagePath - Relative path from OUT_DIR (e.g. "build/index.html") for exemption matching.
 */
export function checkMarkdownQuality(markdown: string, pagePath?: string): string[] {
  // Redirect and fallback pages are intentionally minimal — skip quality checks.
  if (markdown.startsWith('This page redirects to') || markdown.startsWith('No content found')) {
    return [];
  }
  const exemptions =
    (pagePath
      ? KNOWN_WARNING_EXEMPTIONS[pagePath as keyof typeof KNOWN_WARNING_EXEMPTIONS]
      : undefined) ?? [];
  const warnings: string[] = [];
  if (!/(^|\n)#{1,6}\s/.test(markdown)) {
    warnings.push('No headings found');
  }
  if (markdown.length < 100) {
    warnings.push(`Suspiciously short (${markdown.length} chars)`);
  }
  // Check prose content only (not code examples) for HTML/CSS leakage
  const prose = stripCodeBlocks(markdown);
  if (/<div[\s>]/.test(prose) || /<span[\s>]/.test(prose)) {
    warnings.push('Contains raw HTML tags (<div> or <span>)');
  }
  if (/bg-palette-|select-none|rounded-full/.test(prose)) {
    warnings.push('Contains CSS class names in text');
  }
  return warnings.filter(w => !exemptions.some(ex => w.startsWith(ex)));
}

const CI_CSS_CLASS_PATTERN = /\b(bg-palette-|select-none|rounded-full\s+border|terminal-snippet)\b/;

/**
 * Strict quality check for CI — used by check-markdown-pages.js as a blocking gate.
 * Returns an array of error strings (empty if the page passes).
 *
 * @param pagePath - Relative path from OUT_DIR (e.g. "faq/index.html") for exemption matching.
 */
export function checkPage(markdown: string, pagePath?: string): string[] {
  // Redirect and fallback pages are intentionally minimal — skip quality checks.
  if (markdown.startsWith('This page redirects to') || markdown.startsWith('No content found')) {
    return [];
  }
  const exemptions =
    (pagePath
      ? KNOWN_WARNING_EXEMPTIONS[pagePath as keyof typeof KNOWN_WARNING_EXEMPTIONS]
      : undefined) ?? [];
  const errors: string[] = [];

  if (!markdown.trim()) {
    errors.push('Empty file');
    return errors;
  }

  if (!/(^|\n)#{1,6}\s/.test(markdown)) {
    errors.push('No headings found');
  }

  // Check that code fences are balanced (must happen before stripping)
  const fenceCount = (markdown.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    errors.push(`Unbalanced code fences (${fenceCount} fence markers)`);
  }

  // Strip code blocks before checking for HTML/CSS leakage — docs teach React
  // so code examples legitimately contain <div>, <span>, CSS class names.
  const prose = stripCodeBlocks(markdown);

  if (/<div[\s>]/.test(prose) || /<span[\s>]/.test(prose)) {
    errors.push('Contains raw HTML tags');
  }

  if (CI_CSS_CLASS_PATTERN.test(prose)) {
    errors.push('Contains CSS class names in text');
  }

  return errors.filter(error => !exemptions.some(ex => error.startsWith(ex)));
}

const NO_CONTENT_FALLBACK =
  'No content found for this page. See https://docs.expo.dev/llms.txt for a full index of available documentation.\n';

/**
 * Convert a full HTML page string to markdown, extracting <main> content.
 * Always returns a string so every page gets a .md file.
 * For redirect pages (meta refresh), returns a pointer to the redirect target.
 */
export function convertHtmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);

  // Detect redirect pages via <meta http-equiv="refresh" content="0; url=/path/">
  const refreshMeta = $('meta[http-equiv="refresh"]').attr('content');
  if (refreshMeta) {
    const match = refreshMeta.match(/url=(\S+)/i);
    if (match) {
      const target = match[1];
      return `This page redirects to [${target}](https://docs.expo.dev${target}).\n`;
    }
  }

  const main = $('main');
  if (main.length === 0) {
    return NO_CONTENT_FALLBACK;
  }

  cleanHtml($, main);

  const mainHtml = main.html();
  if (!mainHtml) {
    return NO_CONTENT_FALLBACK;
  }

  let markdown = turndown.turndown(mainHtml);
  markdown = cleanMarkdown(markdown);

  return markdown ? markdown + '\n' : NO_CONTENT_FALLBACK;
}
