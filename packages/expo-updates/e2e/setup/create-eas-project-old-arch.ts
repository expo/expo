#!/usr/bin/env yarn --silent ts-node --transpile-only

import path from 'path';

import {
  initAsync,
  repoRoot,
  setupE2EAppAsync,
  transformAppJsonForE2EWithOldArch,
} from './project';

const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

/**
 *
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to build a test app and run both suites
 * of updates E2E tests in the Detox environment.
 *
 * This test project will use the old architecture (Paper).
 *
 * See `packages/expo-updates/e2e/README.md` for instructions on how
 * to run these tests locally.
 *
 */

(async function () {
  if (!repoRoot || !process.env.UPDATES_HOST || !process.env.UPDATES_PORT) {
    throw new Error('Missing one or more environment variables; see instructions in e2e/README.md');
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'updates-e2e');
  const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');

  await initAsync(projectRoot, {
    repoRoot,
    runtimeVersion,
    localCliBin,
    transformAppJson: transformAppJsonForE2EWithOldArch,
  });

  await setupE2EAppAsync(projectRoot, { localCliBin, repoRoot });
})();
