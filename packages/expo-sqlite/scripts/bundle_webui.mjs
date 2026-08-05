#!/usr/bin/env node

// Export the SQLite inspector devtools plugin web UI into `dev-plugin-dist`, which the dev server
// serves as the plugin page. `build:webui` runs this as the last step of the package's `build`, so
// turbo caches the output and `prepublishOnly` picks it up for the published tarball.
// Standalone, use `pnpm bundle:webui`: Metro resolves `expo-sqlite` to `build/`, not `src`, so a
// stale `build/` would otherwise end up in the bundle.

// Node builtins only, so the script never depends on its own package being installed.
import { spawnSync } from 'node:child_process';
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

const result = spawnSync(nodePath, [expoCliJs, 'export', '-p', 'web', '--output-dir', 'dist'], {
  stdio: 'inherit',
  cwd: webuiRoot,
});
if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await rm(outputDir, { recursive: true, force: true });
await rename(exportDir, outputDir);

console.log(`DevTools plugin web UI is ready at: ${outputDir}`);
