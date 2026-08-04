// Generates the @expo/ui component tables from page frontmatter. Run: pnpm generate-ui-component-tables

import fm from 'front-matter';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PAGES_DIR = path.join(process.cwd(), 'pages', 'versions');

// latest/ is a build-time copy of v<version> (copy-latest.js), so we never write to it.
const { version } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

interface SectionConfig {
  dir: string;
  label: string;
  platformPrefix: string | null;
  // false for sections that already ship a curated list we don't want to clobber.
  generateSectionTable: boolean;
  // 'grid' needs card thumbnails, so only sections that ship them can use it.
  render: 'table' | 'grid';
  // Filename prefix for card thumbnails, null for sections without them.
  cardPrefix: 'ios' | 'android' | null;
}

const SECTIONS: SectionConfig[] = [
  {
    dir: 'drop-in-replacements',
    label: 'Drop-in replacements',
    platformPrefix: null,
    generateSectionTable: false,
    render: 'table',
    cardPrefix: null,
  },
  {
    dir: 'universal',
    label: 'Universal',
    platformPrefix: null,
    generateSectionTable: false,
    render: 'table',
    cardPrefix: null,
  },
  {
    dir: 'jetpack-compose',
    label: 'Jetpack Compose',
    platformPrefix: 'Jetpack Compose',
    generateSectionTable: true,
    render: 'grid',
    cardPrefix: 'android',
  },
  {
    dir: 'swift-ui',
    label: 'SwiftUI',
    platformPrefix: 'SwiftUI',
    generateSectionTable: true,
    render: 'grid',
    cardPrefix: 'ios',
  },
];

const IMAGES_DIR = path.join(process.cwd(), 'public', 'static', 'images', 'expo-ui');
const GRID_IMPORT =
  "import { UIComponentCard, UIComponentGrid } from '~/ui/components/UIComponentGrid';";

// Only the section overview is excluded; everything else in the sidebar gets a card.
const EXCLUDED_SLUGS = new Set(['index']);

const MARKER_START =
  '{/* @generated:ui-component-table. Do not edit by hand. Run `pnpm generate-ui-component-tables`. */}';
const MARKER_END = '{/* @generated:ui-component-table:end */}';
const BLOCK_RE =
  /{\/\* @generated:ui-component-table(?!:end)[\S\s]*?@generated:ui-component-table:end \*\/}/;

// Each version is read from its own pages, so it only ever lists the components it shipped.
const VERSIONS = ['unversioned', `v${version}`, 'v56.0.0'];

interface ComponentEntry {
  title: string;
  slug: string;
  description: string;
}

interface Frontmatter {
  title?: string;
  description?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

function cleanDescription(description: string, platformPrefix: string | null): string {
  const text = description.trim();
  if (!platformPrefix) {
    return text;
  }
  const stripped = text.replace(new RegExp(`^(?:An? )?${escapeRegExp(platformPrefix)}\\s+`), '');
  return stripped !== text && stripped.length > 0
    ? stripped[0].toUpperCase() + stripped.slice(1)
    : text;
}

function readComponents(uiDir: string, section: SectionConfig): ComponentEntry[] {
  const dir = path.join(uiDir, section.dir);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries: ComponentEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    const slug = file.replace(/\.mdx$/, '');
    if (!file.endsWith('.mdx') || EXCLUDED_SLUGS.has(slug)) {
      continue;
    }

    const attributes = (fm(fs.readFileSync(path.join(dir, file), 'utf8')).attributes ??
      {}) as Frontmatter;
    const title = (attributes.title ?? '').trim();
    if (!title) {
      continue;
    }

    entries.push({
      title,
      slug,
      description: cleanDescription(attributes.description ?? '', section.platformPrefix),
    });
  }

  return entries.sort((a, b) => a.title.localeCompare(b.title));
}

function renderTable(entries: ComponentEntry[], linkPrefix: string): string {
  const rows = entries.map(
    entry => `| [\`${entry.title}\`](${linkPrefix}${entry.slug}) | ${entry.description} |`
  );
  return ['| Component | Description |', '| --- | --- |', ...rows].join('\n');
}

// One asset serves both the card and the component page. A `-card-` file is an override,
// used only where the page needs a different aspect than the thumbnail (BottomSheet), or
// where the page has no preview of its own (Material Colors).
function cardImage(slug: string, cardPrefix: string, theme: 'light' | 'dark'): string | null {
  for (const file of [`${cardPrefix}-card-${theme}.webp`, `${cardPrefix}-${theme}.webp`]) {
    if (fs.existsSync(path.join(IMAGES_DIR, slug, file))) {
      return `/static/images/expo-ui/${slug}/${file}`;
    }
  }
  return null;
}

function renderGrid(
  entries: ComponentEntry[],
  linkPrefix: string,
  cardPrefix: 'ios' | 'android'
): string {
  const cards = entries.map(entry => {
    const src = cardImage(entry.slug, cardPrefix, 'light');
    const darkSrc = cardImage(entry.slug, cardPrefix, 'dark');
    // Cards with no art fall back to an icon: the platform's, or React's for a hook.
    const placeholder = entry.title.startsWith('use')
      ? 'hook'
      : cardPrefix === 'ios'
        ? 'ios'
        : 'android';
    const attributes = [
      `title="${entry.title}"`,
      `href="${linkPrefix}${entry.slug}"`,
      `description="${entry.description.replace(/"/g, '&quot;')}"`,
      ...(src ? [`src="${src}"`] : [`placeholder="${placeholder}"`]),
      ...(darkSrc ? [`darkSrc="${darkSrc}"`] : []),
    ];
    return `  <UIComponentCard ${attributes.join(' ')} />`;
  });
  return ['<UIComponentGrid>', ...cards, '</UIComponentGrid>'].join('\n');
}

function renderSection(entries: ComponentEntry[], linkPrefix: string, section: SectionConfig) {
  return section.render === 'grid' && section.cardPrefix
    ? renderGrid(entries, linkPrefix, section.cardPrefix)
    : renderTable(entries, linkPrefix);
}

// Idempotent: appended after the page's last real import, or right after the frontmatter.
// Fence-aware, because pages show `import` statements inside tsx samples too.
function ensureGridImport(content: string): string {
  if (content.includes(GRID_IMPORT)) {
    return content;
  }

  const lines = content.split('\n');
  let lastImport = -1;
  let inFence = false;
  for (const [index, line] of lines.entries()) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && /^import .+ from '.+';$/.test(line)) {
      lastImport = index;
    }
  }

  if (lastImport !== -1) {
    lines.splice(lastImport + 1, 0, GRID_IMPORT);
    return lines.join('\n');
  }

  const frontmatterEnd = content.indexOf('\n---', 3);
  if (frontmatterEnd === -1) {
    return `${GRID_IMPORT}\n\n${content}`;
  }
  const insertAt = frontmatterEnd + '\n---'.length;
  return `${content.slice(0, insertAt)}\n\n${GRID_IMPORT}${content.slice(insertAt)}`;
}

function wrapGenerated(inner: string): string {
  return `${MARKER_START}\n\n${inner}\n\n${MARKER_END}`;
}

const COMPONENTS_HEADING = '## Available components';
const STRIP_RE = new RegExp(`\\n*(?:#{1,6} [^\\n]*\\n+)?${BLOCK_RE.source}`);

// Strip any previous block, then append a fresh one at the end of the page (idempotent).
function upsertGeneratedBlock(
  filePath: string,
  inner: string,
  needsGridImport: boolean
): 'updated' | 'inserted' {
  const original = fs.readFileSync(filePath, 'utf8');
  const existed = BLOCK_RE.test(original);
  let body = original.replace(STRIP_RE, '').replace(/\s*$/, '');
  if (needsGridImport) {
    body = ensureGridImport(body);
  }
  fs.writeFileSync(filePath, `${body}\n\n${COMPONENTS_HEADING}\n\n${wrapGenerated(inner)}\n`);
  return existed ? 'updated' : 'inserted';
}

function main(): void {
  const summary: string[] = [];

  for (const versionDir of VERSIONS) {
    const uiDir = path.join(PAGES_DIR, versionDir, 'sdk', 'ui');
    if (!fs.existsSync(uiDir)) {
      console.warn(`Skipping ${versionDir}: ${uiDir} not found`);
      continue;
    }

    const aggregated: string[] = [];
    let overviewNeedsGrid = false;
    for (const section of SECTIONS) {
      const components = readComponents(uiDir, section);
      if (components.length === 0) {
        continue;
      }

      const isGrid = section.render === 'grid' && section.cardPrefix !== null;
      overviewNeedsGrid ||= isGrid;
      aggregated.push(
        `### ${section.label}\n\n${renderSection(components, `${section.dir}/`, section)}`
      );

      if (!section.generateSectionTable) {
        summary.push(`${versionDir}/${section.dir}: section table skipped (curated list kept)`);
        continue;
      }

      const indexPath = path.join(uiDir, section.dir, 'index.mdx');
      if (fs.existsSync(indexPath)) {
        const result = upsertGeneratedBlock(
          indexPath,
          renderSection(components, '', section),
          isGrid
        );
        summary.push(
          `${versionDir}/${section.dir}: ${result} (${components.length} components, ${section.render})`
        );
      }
    }

    const overviewPath = path.join(uiDir, 'index.mdx');
    if (fs.existsSync(overviewPath) && aggregated.length > 0) {
      const result = upsertGeneratedBlock(overviewPath, aggregated.join('\n\n'), overviewNeedsGrid);
      summary.push(`${versionDir}/ (overview): ${result}`);
    }
  }

  console.log(summary.join('\n'));

  console.log('Running pnpm format...');
  execSync('pnpm format', { stdio: 'inherit' });
}

main();
