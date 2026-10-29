import fs from 'node:fs';

import {
  MANIFEST_PATH,
  englishSourceFor,
  hashEnglishSource,
  listJaPages,
  readManifest,
  relKey,
} from './sync.ts';

const requestedKeys = new Set(process.argv.slice(2));
const jaPages = listJaPages();
const knownKeys = new Set(jaPages.map(relKey));

for (const key of requestedKeys) {
  if (!knownKeys.has(key)) {
    console.error(
      `Cannot stamp ${key}: no Japanese page exists at pages/ja/${key}. Pass a path relative to pages/ja, such as tutorial/follow-up.mdx, or pass no paths to stamp every page.`
    );
    process.exit(1);
  }
}

const manifest: Record<string, string> = requestedKeys.size > 0 ? readManifest() : {};
for (const jaPath of jaPages) {
  const key = relKey(jaPath);
  const englishPath = englishSourceFor(jaPath);
  if ((requestedKeys.size === 0 || requestedKeys.has(key)) && fs.existsSync(englishPath)) {
    manifest[key] = hashEnglishSource(englishPath);
  }
}

const sorted: Record<string, string> = {};
for (const key of Object.keys(manifest).sort()) {
  sorted[key] = manifest[key];
}

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Wrote ${Object.keys(sorted).length} entries to ${MANIFEST_PATH}.`);
