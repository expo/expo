import fs from 'node:fs';

import { englishSourceFor, hashEnglishSource, listJaPages, readManifest, relKey } from './sync.ts';

const manifest = readManifest();
const jaPages = listJaPages();
const issues: string[] = [];

for (const jaPath of jaPages) {
  const key = relKey(jaPath);
  const englishPath = englishSourceFor(jaPath);
  if (!fs.existsSync(englishPath)) {
    issues.push(`pages/ja/${key}  orphan translation (no English source)`);
  } else if (!manifest[key]) {
    issues.push(`pages/ja/${key}  missing from checks/ja/source-hashes.json (run pnpm ja:stamp)`);
  } else if (manifest[key] !== hashEnglishSource(englishPath)) {
    issues.push(
      `pages/ja/${key}  stale: English source changed since last sync (update the translation, then run pnpm ja:stamp)`
    );
  }
}

for (const issue of issues) {
  console.log(issue);
}

console.log(
  issues.length === 0
    ? `All ${jaPages.length} Japanese pages are in sync with their English sources.`
    : `${issues.length} of ${jaPages.length} Japanese pages need a sync.`
);
