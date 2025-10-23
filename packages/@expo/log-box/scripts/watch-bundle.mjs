#! /usr/bin/env node

// Rebuild the ExpoLogBox.bundle on a file change in the package.
// Use `yarn watch` to run this script.

import { watch } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const outputDir = resolve('dist');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await import('./build-bundle.mjs');

try {
  const watcher = watch(join(__dirname, '..'), { persistent: true, recursive: true });
  for await (const { filename } of watcher) {
    if (resolve(filename).startsWith(outputDir)) {
      continue;
    }

    console.clear();
    console.log('Changes detected, rebuilding...');
    try {
      await import(`./build-bundle.mjs?run=${Date.now()}`);
    } catch {
      // Error is already logged in build-bundle.mjs
    }
  }
} catch (err) {
  if (err.name === 'AbortError') process.exit(1);
  throw err;
}
