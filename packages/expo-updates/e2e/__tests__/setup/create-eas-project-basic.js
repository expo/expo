const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

const { initAsync, setupBasicAppAsync, setupAssetsAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

// Useful for local testing
const skipAssetTestApp = process.env.EXPO_SKIP_ASSET_TEST_APP === '1';

/**
 *
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to build a test app and run the "basic" suite
 * of updates E2E tests in the Detox environment. For CI, it also
 * generates the "assets" test project and packs it up as a tarball
 * so that both basic and assets tests can be run in the same EAS job.
 *
 * See `packages/expo-updates/e2e/README.md` for instructions on how
 * to run these tests locally.
 *
 */

(async function () {
  if (!process.env.EXPO_REPO_ROOT || !process.env.UPDATES_HOST || !process.env.UPDATES_PORT) {
    throw new Error(
      'Missing one or more environment variables; see instructions in e2e/__tests__/setup/index.js'
    );
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'updates-e2e');
  const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');

  await initAsync(projectRoot, { repoRoot, runtimeVersion, localCliBin });

  await setupBasicAppAsync(projectRoot, localCliBin);

  if (skipAssetTestApp) {
    return;
  }

  // Build assets project as a subdirectory in the project
  const assetsProjectRoot = path.join(process.env.TEST_PROJECT_ROOT, 'updates-e2e');

  await initAsync(assetsProjectRoot, { repoRoot, runtimeVersion, localCliBin });

  await setupAssetsAppAsync(assetsProjectRoot, localCliBin);

  // Remove node_modules
  await fs.rm(path.join(assetsProjectRoot, 'node_modules'), { force: true, recursive: true });

  // Pack up the assets app as a tarball and remove the directory
  await spawnAsync('tar', ['zcf', path.join(projectRoot, 'updates-e2e-assets.tar.gz'), '.'], {
    cwd: assetsProjectRoot,
    stdio: 'inherit',
  });
  await fs.rm(assetsProjectRoot, { force: true, recursive: true });
})();
