import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildUpgradeDiffMarkdown,
  generateUpgradeDiffPages,
  isUpgradePairMarkdownPath,
  listUpgradePairs,
  upgradeDiffPagePath,
} from './generate-upgrade-diff-pages.ts';

const DIFF_52_53 = `diff --git a/templates/expo-template-bare-minimum/package.json b/templates/expo-template-bare-minimum/package.json
index 1111111..2222222 100644
--- a/templates/expo-template-bare-minimum/package.json
+++ b/templates/expo-template-bare-minimum/package.json
@@ -1,3 +1,3 @@
 {
-  "version": "52.0.0",
+  "version": "53.0.0",
 }`;

const DIFF_52_UNVERSIONED = DIFF_52_53.replace('53.0.0', '54.0.0-canary');
const DIFF_53_UNVERSIONED = DIFF_52_53.replace('"version": "52.0.0",', '"version": "53.0.0",');

const diffInfo = {
  versions: ['52', '53', '54', 'unversioned'],
  diffs: {
    '52..52': '',
    '52..53': DIFF_52_53,
    '53..53': '',
    '53..54': '   \n',
    '52..unversioned': DIFF_52_UNVERSIONED,
    '53..unversioned': DIFF_53_UNVERSIONED,
    'unversioned..unversioned': '',
  },
};

describe(listUpgradePairs, () => {
  it('skips identity pairs', () => {
    const pairs = listUpgradePairs(diffInfo, { includeUnversioned: true });
    expect(pairs).not.toContainEqual({ from: '52', to: '52' });
    expect(pairs).not.toContainEqual({ from: 'unversioned', to: 'unversioned' });
  });

  it('skips pairs whose diff content is empty', () => {
    const pairs = listUpgradePairs(diffInfo, { includeUnversioned: true });
    expect(pairs).not.toContainEqual({ from: '53', to: '54' });
  });

  it('includes unversioned pairs when unversioned is shown in this environment', () => {
    const pairs = listUpgradePairs(diffInfo, { includeUnversioned: true });
    expect(pairs).toContainEqual({ from: '52', to: 'unversioned' });
    expect(pairs).toContainEqual({ from: '53', to: 'unversioned' });
  });

  it('excludes unversioned pairs when unversioned is hidden, as on production', () => {
    const pairs = listUpgradePairs(diffInfo, { includeUnversioned: false });
    expect(pairs).toEqual([{ from: '52', to: '53' }]);
  });
});

describe(upgradeDiffPagePath, () => {
  it('places each pair in its own directory so the /<slug>.md rewrite resolves it', () => {
    expect(upgradeDiffPagePath('52', '57')).toBe('52-to-57/index.md');
    expect(upgradeDiffPagePath('52', 'unversioned')).toBe('52-to-unversioned/index.md');
  });
});

describe(isUpgradePairMarkdownPath, () => {
  it('matches generated pair pages', () => {
    expect(isUpgradePairMarkdownPath('bare/upgrade/52-to-57/index.md')).toBe(true);
    expect(isUpgradePairMarkdownPath('bare/upgrade/52-to-unversioned/index.md')).toBe(true);
  });

  it('does not match the page itself or other pages', () => {
    expect(isUpgradePairMarkdownPath('bare/upgrade/index.md')).toBe(false);
    expect(isUpgradePairMarkdownPath('bare/overview/index.md')).toBe(false);
    expect(isUpgradePairMarkdownPath('guides/how-to/index.md')).toBe(false);
  });
});

describe(buildUpgradeDiffMarkdown, () => {
  const markdown = buildUpgradeDiffMarkdown({ from: '52', to: '53', diff: DIFF_52_53 });

  it('starts with frontmatter naming both SDK versions', () => {
    expect(markdown.startsWith('---\n')).toBe(true);
    const frontmatter = markdown.split('---\n')[1];
    expect(frontmatter).toContain('title: ');
    expect(frontmatter).toContain('SDK 52 to SDK 53');
    expect(frontmatter).toContain('description: ');
  });

  it('includes the same apply instructions as the Copy prompt action', () => {
    expect(markdown).toContain('from SDK 52 to SDK 53');
    expect(markdown).toContain('My project is NOT identical to the template');
    expect(markdown).toContain('do not assume a clean `git apply`');
  });

  it('wraps the raw diff in a diff code fence', () => {
    expect(markdown).toContain('```diff\n' + DIFF_52_53 + '\n```');
  });

  it('uses a longer fence when the diff itself contains triple backticks', () => {
    const trickyDiff = DIFF_52_53 + '\n+```\n+code\n+```';
    const tricky = buildUpgradeDiffMarkdown({ from: '52', to: '53', diff: trickyDiff });
    expect(tricky).toContain('````diff\n');
    expect(tricky).toContain('\n````');
  });

  it('links back to the upgrade helper pinned to the same version pair', () => {
    expect(markdown).toContain('https://docs.expo.dev/bare/upgrade/?fromSdk=52&toSdk=53');
  });

  it('ends with a single trailing newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});

describe(generateUpgradeDiffPages, () => {
  it('writes one markdown file per eligible pair under bare/upgrade', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-diff-pages-'));
    try {
      const written = generateUpgradeDiffPages({
        outDir,
        diffInfo,
        includeUnversioned: false,
      });

      expect(written).toEqual(['52-to-53/index.md']);
      const filePath = path.join(outDir, 'bare', 'upgrade', '52-to-53', 'index.md');
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(
        buildUpgradeDiffMarkdown({ from: '52', to: '53', diff: DIFF_52_53 })
      );
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('writes unversioned pairs only when unversioned is shown', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-diff-pages-'));
    try {
      const written = generateUpgradeDiffPages({
        outDir,
        diffInfo,
        includeUnversioned: true,
      });

      expect(written).toEqual([
        '52-to-53/index.md',
        '52-to-unversioned/index.md',
        '53-to-unversioned/index.md',
      ]);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('removes stale pair pages and legacy flat pair files from a previous run', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-diff-pages-'));
    try {
      const pageDir = path.join(outDir, 'bare', 'upgrade');
      fs.mkdirSync(path.join(pageDir, '50-to-51'), { recursive: true });
      fs.writeFileSync(path.join(pageDir, '50-to-51', 'index.md'), 'stale');
      fs.writeFileSync(path.join(pageDir, '50-to-51.md'), 'stale flat file');
      fs.writeFileSync(path.join(pageDir, 'index.md'), 'converted page');

      generateUpgradeDiffPages({ outDir, diffInfo, includeUnversioned: false });

      expect(fs.existsSync(path.join(pageDir, '50-to-51'))).toBe(false);
      expect(fs.existsSync(path.join(pageDir, '50-to-51.md'))).toBe(false);
      expect(fs.readFileSync(path.join(pageDir, 'index.md'), 'utf-8')).toBe('converted page');
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});
