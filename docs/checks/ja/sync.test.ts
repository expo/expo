import fs from 'node:fs';

import { englishSourceFor, hashEnglishSource, listJaPages, readManifest, relKey } from './sync.ts';

interface Issue {
  file: string;
  problem: string;
}

function collect(): { checked: number; issues: Issue[] } {
  const issues: Issue[] = [];
  const manifest = readManifest();
  const jaPages = listJaPages();

  for (const jaPath of jaPages) {
    const key = relKey(jaPath);
    const englishPath = englishSourceFor(jaPath);
    if (!fs.existsSync(englishPath)) {
      issues.push({ file: `pages/ja/${key}`, problem: 'orphan translation (no English source)' });
      continue;
    }
    const stored = manifest[key];
    if (!stored) {
      issues.push({
        file: `pages/ja/${key}`,
        problem: 'missing from checks/ja/source-hashes.json (run pnpm ja:stamp)',
      });
      continue;
    }
    if (stored !== hashEnglishSource(englishPath)) {
      issues.push({
        file: `pages/ja/${key}`,
        problem:
          'stale: English source changed since last sync (update the translation, then run pnpm ja:stamp)',
      });
    }
  }

  return { checked: jaPages.length, issues };
}

describe('docs ja translation sync', () => {
  const { checked, issues } = collect();

  it('scans the translated pages (guards against a vacuous pass)', () => {
    expect(checked).toBeGreaterThan(0);
  });

  it('every ja page is in sync with its English source', () => {
    const report = issues.map(i => `${i.file}  ${i.problem}`).join('\n');
    expect(report).toBe('');
  });
});
