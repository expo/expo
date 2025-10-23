#!/usr/bin/env node

// Build the ExpoLogBox.bundle DOM Component.
// Use `yarn build` to run this script.

import spawn from '@expo/spawn-async';
import { globSync } from 'glob';
import { rm, rename } from 'node:fs/promises';
import { join, dirname } from 'path';
import { argv } from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputLogBoxBundle = 'ExpoLogBox.bundle';
const defaultDomComponentsBundle = 'www.bundle';
const outputDir = 'dist';
const appBundlePath = join(outputDir, 'app.bundle');
const indexHtmlPath = join(outputDir, defaultDomComponentsBundle, 'index.html');

await rm(outputDir, { recursive: true, force: true });

const result = await spawn(
  'yarn',
  [
    'expo',
    'export:embed',
    '--platform',
    'android',
    '--bundle-output',
    appBundlePath,
    '--entry-file',
    join(__dirname, '../app/index.ts'),
    ...argv.slice(2),
  ],
  { stdio: 'inherit' }
);

if (result.error) {
  process.exit(1);
}

// The app bundle is only empty shell as a workaround to export the dom component
await rm(appBundlePath, { force: true });
await rm(indexHtmlPath, { force: true });

// The entry html will be the dom component
const htmlPaths = globSync(
  join(outputDir, defaultDomComponentsBundle, '*.html').replace(/\\/g, '/')
);
if (htmlPaths.length !== 1) {
  console.error('Expected exactly one HTML file in the bundle output directory.');
  process.exit(1);
}

await rename(htmlPaths[0], indexHtmlPath);

await rename(join(outputDir, defaultDomComponentsBundle), join(outputDir, outputLogBoxBundle));

console.log(`LogBox bundle is ready at: ${join(outputDir, outputLogBoxBundle)}`);
