#! /usr/bin/env node

import { watch } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const outputDir = resolve('dist');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await import('./build.mjs');

try {
  const watcher = watch(join(__dirname, '..'), { persistent: true, recursive: true });
  for await (const { filename } of watcher) {
    if (resolve(filename).startsWith(outputDir)) {
      continue;
    }

    console.clear();
    console.log('Changes detected, rebuilding...');
    await import(`./build.mjs?run=${Date.now()}`);
  }
} catch (err) {
  if (err.name === 'AbortError') process.exit(1);
  throw err;
}
