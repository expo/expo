#!/usr/bin/env yarn --silent ts-node --transpile-only

import path from 'path';

import {
  initAsync,
  repoRoot,
  setupUpdatesDevClientE2EAppAsync,
  transformAppJsonForE2EWithDevClient,
} from './project';

const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

/**
 *
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to verify compilation of Expo packages on tvOS,
 * and manually exercise the dev client and dev launcher on tvOS.
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
    configureE2E: true,
    shouldGenerateTestUpdateBundles: true,
    shouldConfigureCodeSigning: true,
    includeDevClient: true,
    isTV: true,
    transformAppJson: transformAppJsonForE2EWithDevClient,
  });

  await setupUpdatesDevClientE2EAppAsync(projectRoot, { localCliBin, repoRoot, isTV: true });
})();
