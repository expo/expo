import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';

import type { Feature, SubstitutionData, LocalSubstitutionData } from './types';

type AnySubstitutionData = SubstitutionData | LocalSubstitutionData;

const MODULE_LEVEL_FEATURES: Feature[] = [
  'Event',
  'Constant',
  'Function',
  'AsyncFunction',
  'View',
  'SharedObject',
];

const VIEW_LEVEL_FEATURES: Feature[] = ['ViewEvent'];
const WEB_MODULE_FEATURES: Feature[] = ['Constant', 'Function', 'AsyncFunction'];
const APP_SNIPPET_FEATURES: Feature[] = [
  'Constant',
  'Function',
  'AsyncFunction',
  'Event',
  'View',
  'SharedObject',
];

async function readSnippet(
  snippetsDir: string,
  feature: string,
  filename: string
): Promise<string | null> {
  const snippetPath = path.join(snippetsDir, feature, filename);
  try {
    return await fs.promises.readFile(snippetPath, 'utf8');
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
    return null;
  }
}

async function renderSnippet(
  snippetsDir: string,
  feature: string,
  filename: string,
  data: object
): Promise<string> {
  const template = await readSnippet(snippetsDir, feature, filename);
  if (!template) return '';
  return ejs.render(template, data);
}

/**
 * Builds the content for the moduleSnippetsSwift / moduleSnippetsKt slots.
 */
export async function buildModuleSnippets(
  snippetsDir: string,
  features: string[],
  data: object,
  ext: 'swift' | 'kt',
  viewSnippets = ''
): Promise<string> {
  const dataWithView = { ...data, viewSnippets };
  const selected = MODULE_LEVEL_FEATURES.filter((f) => features.includes(f));
  const parts = await Promise.all(
    selected.map((feature) =>
      renderSnippet(snippetsDir, feature, `module.${ext}.ejs`, dataWithView)
    )
  );
  return parts
    .filter(Boolean)
    .map((p) => p.trimEnd())
    .join('\n\n');
}

/**
 * Builds the content for the viewSnippetsSwift / viewSnippetsKt slots.
 */
export async function buildViewSnippets(
  snippetsDir: string,
  features: string[],
  data: object,
  ext: 'swift' | 'kt'
): Promise<string> {
  const selected = VIEW_LEVEL_FEATURES.filter((f) => features.includes(f));
  const parts = await Promise.all(
    selected.map((feature) => renderSnippet(snippetsDir, feature, `view-block.${ext}.ejs`, data))
  );
  return parts.filter(Boolean).join('\n');
}

/**
 * Builds the class body content for the web module implementation slot.
 */
export async function buildWebModuleSnippets(
  snippetsDir: string,
  features: string[],
  data: object
): Promise<string> {
  const selected = WEB_MODULE_FEATURES.filter((f) => features.includes(f));
  const parts = await Promise.all(
    selected.map((feature) => renderSnippet(snippetsDir, feature, 'web.module.ts.ejs', data))
  );
  return parts.filter(Boolean).join('\n\n');
}

/**
 * Builds the content for an App.tsx slot.
 */
export async function buildAppSnippets(
  snippetsDir: string,
  features: string[],
  data: object,
  section: 'imports' | 'react-imports' | 'external-imports' | 'hooks' | 'jsx'
): Promise<string> {
  const selected = APP_SNIPPET_FEATURES.filter((f) => features.includes(f));
  const parts = await Promise.all(
    selected.map((feature) => renderSnippet(snippetsDir, feature, `app.${section}.tsx.ejs`, data))
  );
  const trimmed = parts.map((p) => p.trimEnd()).filter(Boolean);
  if (trimmed.length === 0) return '';
  return trimmed.join('\n') + '\n';
}

type FileSnippetSpec = {
  feature: Feature;
  source: string;
  dest: (data: AnySubstitutionData) => string;
  platform?: 'apple' | 'android';
};

const FILE_SNIPPET_SPECS: FileSnippetSpec[] = [
  {
    feature: 'View',
    source: 'view.swift.ejs',
    dest: (d) => path.join('ios', `${d.project.viewName}.swift`),
    platform: 'apple',
  },
  {
    feature: 'View',
    source: 'view.kt.ejs',
    dest: (d) =>
      path.join(
        'android',
        'src',
        'main',
        'java',
        ...d.project.package.split('.'),
        `${d.project.viewName}.kt`
      ),
    platform: 'android',
  },
  {
    feature: 'View',
    source: 'view.tsx.ejs',
    dest: (d) => path.join('src', `${d.project.viewName}.tsx`),
  },
  {
    feature: 'View',
    source: 'view.web.tsx.ejs',
    dest: (d) => path.join('src', `${d.project.viewName}.web.tsx`),
  },
  {
    feature: 'SharedObject',
    source: 'sharedObject.swift.ejs',
    dest: (d) => path.join('ios', `${d.project.sharedObjectName}.swift`),
    platform: 'apple',
  },
  {
    feature: 'SharedObject',
    source: 'sharedObject.kt.ejs',
    dest: (d) =>
      path.join(
        'android',
        'src',
        'main',
        'java',
        ...d.project.package.split('.'),
        `${d.project.sharedObjectName}.kt`
      ),
    platform: 'android',
  },
  {
    feature: 'SharedObject',
    source: 'sharedObject.ts.ejs',
    dest: (d) => path.join('src', `${d.project.sharedObjectName}.ts`),
  },
];

/**
 * Copies whole-file snippets (view classes, SharedObject classes) to the target directory.
 */
export async function copyFileSnippets(
  snippetsDir: string,
  features: string[],
  data: AnySubstitutionData,
  targetDir: string
): Promise<void> {
  const selectedPlatforms: string[] = data.project.platforms;

  for (const spec of FILE_SNIPPET_SPECS) {
    if (!features.includes(spec.feature)) continue;
    if (spec.platform === 'apple' && !selectedPlatforms.includes('apple')) continue;
    if (spec.platform === 'android' && !selectedPlatforms.includes('android')) continue;

    const template = await readSnippet(snippetsDir, spec.feature, spec.source);
    if (!template) continue;

    const rendered = ejs.render(template, data);
    const destPath = path.join(targetDir, spec.dest(data));

    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, rendered, 'utf8');
  }
}
