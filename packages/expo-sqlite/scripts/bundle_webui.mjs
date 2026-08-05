#!/usr/bin/env node

// Export the SQLite inspector devtools plugin web UI into `dev-plugin-dist`.
// Run it through `pnpm bundle:webui`, which builds the package's `build/` output first — Metro
// resolves `expo-sqlite` to that output, not to `src`, so a stale `build/` silently ends up
// in the bundle.
// Native builds in this monorepo call this script directly, guarded by the `.bundle-on-demand`
// flag file, and rely on `build/` already being current.

import spawn from '@expo/spawn-async';
import { existsSync } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const webuiRoot = join(packageRoot, 'dev-plugin-webui');
const exportDir = join(webuiRoot, 'dist');
const outputDir = join(packageRoot, 'dev-plugin-dist');

// NODE_BINARY is set for Xcode builds via the `with-node.sh` script.
const nodePath = process.env.NODE_BINARY || 'node';

const forceArgvIdx = argv.findIndex((item) => item === '-f' || item === '--force');
if (forceArgvIdx === -1 && existsSync(outputDir)) {
  process.exit(0);
}

const expoCliJs = createRequire(join(webuiRoot, 'noop.js')).resolve('expo/bin/cli');

await rm(exportDir, { recursive: true, force: true });

const result = await spawn(nodePath, [expoCliJs, 'export', '-p', 'web', '--output-dir', 'dist'], {
  stdio: 'inherit',
  cwd: webuiRoot,
});
if (result.error) {
  process.exit(1);
}

await rm(outputDir, { recursive: true, force: true });
await rename(exportDir, outputDir);

console.log(`DevTools plugin web UI is ready at: ${outputDir}`);
