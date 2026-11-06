import fs from 'node:fs';
import path from 'node:path';

import { getServerTesterRoot } from '../__tests__/utils';
import { executeExpoAsync } from './expo';

/** Directory name, relative to the `server-tester` app root, of the export that the Jest global setup produces once per run. */
export const SHARED_DIST_NAME = 'dist';

/**
 * Environment of the shared export. A suite that needs a different export passes its own `export` options to `prepareServers()`.
 * `TEST_SECRET_KEY` is set so the loader suite can assert that the export does not inline server secrets.
 * `CI`, `FORCE_COLOR` and `EXPO_USE_PATH_ALIASES` match what `runExportSideEffects()` sets for the per-suite exports.
 */
export const SHARED_EXPORT_ENV = {
  NODE_ENV: 'production',
  E2E_ROUTER_WEB_OUTPUT: 'server',
  TEST_SECRET_KEY: 'test-secret-key',
  CI: '1',
  FORCE_COLOR: '0',
  EXPO_USE_PATH_ALIASES: '1',
} as const;

export function getSharedDistDir(): string {
  return path.join(getServerTesterRoot(), SHARED_DIST_NAME);
}

/** Removes any previous shared export and exports the `server-tester` app again. */
export async function exportSharedDistAsync(): Promise<void> {
  await fs.promises.rm(getSharedDistDir(), { force: true, recursive: true });
  await executeExpoAsync(
    getServerTesterRoot(),
    ['export', '-p', 'web', '--output-dir', SHARED_DIST_NAME],
    { env: SHARED_EXPORT_ENV }
  );
}

export function assertSharedDistExported(): void {
  const manifestPath = path.join(getSharedDistDir(), 'server/_expo/routes.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `The shared server-tester export is missing (${manifestPath}). The Jest global setup in e2e/jest.global-setup.ts exports it once per run. Run the suite through \`pnpm test:e2e\` from packages/@expo/cli, or pass \`export\` options to prepareServers() for a suite-specific export.`
    );
  }
}
