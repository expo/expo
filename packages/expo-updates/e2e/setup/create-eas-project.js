const path = require('path');

const { initAsync, setupE2EAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

/**
 *
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to build a test app and run both suites
 * of updates E2E tests in the Detox environment.
 *
 * See `packages/expo-updates/e2e/README.md` for instructions on how
 * to run these tests locally.
 *
 */

(async function () {
  if (!process.env.EXPO_REPO_ROOT || !process.env.UPDATES_HOST || !process.env.UPDATES_PORT) {
    throw new Error('Missing one or more environment variables; see instructions in e2e/README.md');
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'updates-e2e');
  const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');

  await initAsync(projectRoot, { repoRoot, runtimeVersion, localCliBin });

  await setupE2EAppAsync(projectRoot, localCliBin, repoRoot);
})();
