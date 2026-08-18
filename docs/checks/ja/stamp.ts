import fs from 'node:fs';

import { MANIFEST_PATH, englishSourceFor, hashEnglishSource, listJaPages, relKey } from './sync.ts';

const manifest: Record<string, string> = {};
for (const jaPath of listJaPages()) {
  const englishPath = englishSourceFor(jaPath);
  if (fs.existsSync(englishPath)) {
    manifest[relKey(jaPath)] = hashEnglishSource(englishPath);
  }
}

const sorted: Record<string, string> = {};
for (const key of Object.keys(manifest).sort()) {
  sorted[key] = manifest[key];
}

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Wrote ${Object.keys(sorted).length} entries to ${MANIFEST_PATH}.`);
