#!/usr/bin/env node

import * as fs from 'fs/promises';
import { EOL } from 'os';
import * as path from 'path';
import { argv, stdout, stderr } from 'process';

// Deploy script for Expo CLI
// This is a mocked deploy script for E2E tests.

const log = (val) => stderr.write(val + EOL, 'utf-8');
const json = (val) => stdout.write(JSON.stringify(val) + EOL, 'utf-8');

log('Running deploy script...');

// Expo CLI does npm run native:deploy -- --export-dir=dist
const distDir = (() => {
  for (const arg of argv) {
    if (arg.startsWith('--export-dir=')) {
      return arg.split('=').splice(1).join('=');
    }
  }
  throw new Error('Expected --export-dir argument');
})();

try {
  await fs.rm('./deploy-target', { recursive: true });
} catch (error) {
  // Do nothing when the directory does not exist.
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
await fs.mkdir('./deploy-target', { recursive: true });

// Mimic EAS Deploy and copy only the server directory.
await fs.cp(path.join(distDir, 'server'), './deploy-target', { recursive: true });

log('Deploy script completed.');

json({
  // stdout of the deploy command is parsed by Expo CLI to determine success and read the deployment URL.
  // Only required field is `url`
  url: 'https://example1234-expo.app/',
  // dashboardUrl is optional
});
