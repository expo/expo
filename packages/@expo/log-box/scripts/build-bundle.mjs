#!/usr/bin/env node

import spawn from '@expo/spawn-async';
import { rm, rename, glob } from 'fs/promises';
import { join } from 'path';

const outputLogBoxBundle = 'ExpoLogBox.bundle';
const defaultDomComponentsBundle = 'www.bundle';
const outputDir = 'dist';
const appBundlePath = join(outputDir, 'app.bundle');
const indexHtmlPath = join(outputDir, defaultDomComponentsBundle, 'index.html');

await rm(outputDir, { recursive: true, force: true });

const result = await spawn(
  'yarn',
  ['expo', 'export:embed', '--platform', 'android', '--bundle-output', appBundlePath],
  { stdio: 'inherit' }
);

if (result.error) {
  process.exit(1);
}

// The app bundle is only empty shell as a workaround to export the dom component
await rm(appBundlePath, { force: true });
await rm(indexHtmlPath, { force: true });

// The entry html will be the dom component
const htmlPaths = await Array.fromAsync(
  glob(join(outputDir, defaultDomComponentsBundle, '*.html'))
);
if (htmlPaths.length !== 1) {
  console.error('Expected exactly one HTML file in the bundle output directory.');
  process.exit(1);
}

await rename(htmlPaths[0], indexHtmlPath);

await rename(join(outputDir, defaultDomComponentsBundle), join(outputDir, outputLogBoxBundle));

console.log(`LogBox bundle is ready at: ${join(outputDir, outputLogBoxBundle)}`);
