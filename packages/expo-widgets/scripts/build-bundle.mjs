#!/usr/bin/env node

// Build the ExpoWidgets.bundle.
// Use `yarn build:bundle` to run this script.

import spawn from '@expo/spawn-async';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'path';
import { argv } from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// NODE_BINARY is set for Xcode builds via the `with-node.sh` script.
const nodePath = process.env.NODE_BINARY || 'node';
const outputDir = join(__dirname, '../bundle/build');
const appBundlePath = join(outputDir, 'ExpoWidgets.bundle');

await rm(outputDir, { recursive: true, force: true });

const expoCliJs = createRequire(__dirname).resolve('expo/bin/cli');

const result = await spawn(
  nodePath,
  [
    expoCliJs,
    'export:embed',
    '--platform',
    'ios',
    '--bundle-output',
    appBundlePath,
    '--entry-file',
    join(__dirname, '../bundle/index.ts'),
    '--dev',
    false,
    ...argv.slice(2),
  ],
  {
    stdio: 'inherit',
    cwd: join(__dirname, '..'),
  }
);

if (result.error) {
  process.exit(1);
}
