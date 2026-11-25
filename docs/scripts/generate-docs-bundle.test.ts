import path from 'node:path';

import { groupPages, pagePathFromFile, translationSections } from './generate-docs-bundle.ts';

const instructions =
  '<AgentInstructions>\n\n## Submitting Feedback\n\nReport it.\n\n</AgentInstructions>';

const camera = [
  '---',
  'title: Camera',
  'packageName: expo-camera',
  '---',
  '',
  'This documentation is available as Markdown for AI agents and LLMs. See the [full Markdown index](https://docs.expo.dev/llms.txt) or append .md to any documentation URL.',
  '',
  '# Camera',
  '',
  instructions,
  '',
  'A React component that renders a preview.',
  '',
].join('\n');

const pages = [
  { path: 'index', markdown: `# Expo docs\n\n${instructions}\n\nWelcome.\n` },
  { path: 'versions/v57.0.0/sdk/camera', markdown: camera },
  { path: 'versions/latest/sdk/camera', markdown: camera },
  { path: 'versions/unversioned/sdk/camera', markdown: camera },
  {
    path: 'guides/overview',
    markdown: '---\ntitle: "Overview"\n---\n\n# Guides overview\n',
  },
  {
    path: 'guides/old',
    markdown:
      '---\ntitle: Old\n---\nThis page redirects to [/guides/new/](https://docs.expo.dev/guides/new.md).\n',
  },
  { path: 'guides/empty', markdown: 'No content found for this page.\n' },
  { path: 'guides/Bad Path', markdown: '# Bad\n' },
  { path: 'versions/v57.0.0/sdk/captureRef', markdown: '# captureRef\n' },
  { path: 'ja/guides/overview', markdown: '# 概要\n' },
  { path: 'ko/guides/overview', markdown: '# 개요\n' },
  { path: 'internal/test-markdown-pipeline', markdown: '# Test\n' },
];

describe('groupPages', () => {
  const { bundles, invalidPaths } = groupPages(pages, ['internal/', 'ja/', 'ko/']);

  it('groups shared and versioned pages and skips latest, unversioned, translations, internal pages, and stubs', () => {
    expect([...bundles.keys()]).toEqual(['shared', 'v57.0.0']);
    expect(bundles.get('shared')!.map(page => page.path)).toEqual(['guides/overview', 'index']);
    expect(bundles.get('v57.0.0')!.map(page => page.path)).toEqual([
      'versions/v57.0.0/sdk/camera',
      'versions/v57.0.0/sdk/captureRef',
    ]);
  });

  it('removes the agent instructions and the Markdown banner, and keeps the frontmatter', () => {
    const page = bundles.get('v57.0.0')!.find(p => p.path === 'versions/v57.0.0/sdk/camera')!;
    expect(page.content).toBe(
      '---\ntitle: Camera\npackageName: expo-camera\n---\n\n# Camera\n\nA React component that renders a preview.\n'
    );
    expect(bundles.get('shared')!.find(p => p.path === 'index')!.content).toBe(
      '# Expo docs\n\nWelcome.\n'
    );
  });

  it('takes the title from the frontmatter, else from the first H1', () => {
    const titles = Object.fromEntries(bundles.get('shared')!.map(p => [p.path, p.title]));
    expect(titles).toEqual({
      'guides/overview': 'Overview',
      index: 'Expo docs',
    });
  });

  it('reports invalid paths', () => {
    expect(invalidPaths).toEqual(['guides/Bad Path']);
  });
});

describe('pagePathFromFile', () => {
  it('maps the root page to index', () => {
    expect(pagePathFromFile('/out', path.join('/out', 'index.md'))).toBe('index');
    expect(pagePathFromFile('/out', path.join('/out', 'eas', 'index.md'))).toBe('eas');
  });
});

describe('translationSections', () => {
  it('names every locale of docs/messages except English', () => {
    expect(translationSections(['en.json', 'ko.json', 'ja.json', 'README.md'])).toEqual([
      'ja/',
      'ko/',
    ]);
  });
});
