// Generates the @expo/ui component tables from page frontmatter. Run: pnpm generate-ui-component-tables

import fm from 'front-matter';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PAGES_DIR = path.join(process.cwd(), 'pages', 'versions');

// latest/ is a build-time copy of v<version> (copy-latest.js), so we never write to it.
const { version } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const VERSIONS = ['unversioned', `v${version}`];

interface SectionConfig {
  dir: string;
  label: string;
  platformPrefix: string | null;
  // false for sections that already ship a curated list we don't want to clobber.
  generateSectionTable: boolean;
}

const SECTIONS: SectionConfig[] = [
  {
    dir: 'drop-in-replacements',
    label: 'Drop-in replacements',
    platformPrefix: null,
    generateSectionTable: false,
  },
  { dir: 'universal', label: 'Universal', platformPrefix: null, generateSectionTable: false },
  {
    dir: 'jetpack-compose',
    label: 'Jetpack Compose',
    platformPrefix: 'Jetpack Compose',
    generateSectionTable: true,
  },
  { dir: 'swift-ui', label: 'SwiftUI', platformPrefix: 'SwiftUI', generateSectionTable: true },
];

// Non-component pages (overview, concepts, hooks) excluded from every table.
const EXCLUDED_SLUGS = new Set(['index', 'modifiers', 'colors', 'usenativestate']);

const MARKER_START =
  '{/* @generated:ui-component-table. Do not edit by hand. Run `pnpm generate-ui-component-tables`. */}';
const MARKER_END = '{/* @generated:ui-component-table:end */}';
const BLOCK_RE =
  /{\/\* @generated:ui-component-table(?!:end)[\S\s]*?@generated:ui-component-table:end \*\/}/;

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

function wrapGenerated(inner: string): string {
  return `${MARKER_START}\n\n${inner}\n\n${MARKER_END}`;
}

const COMPONENTS_HEADING = '## Available components';
const STRIP_RE = new RegExp(`\\n*(?:#{1,6} [^\\n]*\\n+)?${BLOCK_RE.source}`);

// Strip any previous block, then append a fresh one at the end of the page (idempotent).
function upsertGeneratedBlock(filePath: string, inner: string): 'updated' | 'inserted' {
  const original = fs.readFileSync(filePath, 'utf8');
  const existed = BLOCK_RE.test(original);
  const body = original.replace(STRIP_RE, '').replace(/\s*$/, '');
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
    for (const section of SECTIONS) {
      const components = readComponents(uiDir, section);
      if (components.length === 0) {
        continue;
      }

      aggregated.push(`### ${section.label}\n\n${renderTable(components, `${section.dir}/`)}`);

      if (!section.generateSectionTable) {
        summary.push(`${versionDir}/${section.dir}: section table skipped (curated list kept)`);
        continue;
      }

      const indexPath = path.join(uiDir, section.dir, 'index.mdx');
      if (fs.existsSync(indexPath)) {
        const result = upsertGeneratedBlock(indexPath, renderTable(components, ''));
        summary.push(`${versionDir}/${section.dir}: ${result} (${components.length} components)`);
      }
    }

    const overviewPath = path.join(uiDir, 'index.mdx');
    if (fs.existsSync(overviewPath) && aggregated.length > 0) {
      summary.push(
        `${versionDir}/ (overview): ${upsertGeneratedBlock(overviewPath, aggregated.join('\n\n'))}`
      );
    }
  }

  console.log(summary.join('\n'));

  console.log('Running pnpm format...');
  execSync('pnpm format', { stdio: 'inherit' });
}

main();
