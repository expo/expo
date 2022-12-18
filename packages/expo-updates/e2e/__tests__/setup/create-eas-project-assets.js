const path = require('path');

const { initAsync, setupBasicAppAsync, setupAssetsAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

/**
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to build a test app and run the "basic" suite
 * of updates E2E tests in the Detox environment.
 *
 * To test this locally, export the following environment variables:
 * $ export UPDATES_HOST=$(ifconfig -l | xargs -n1 ipconfig getifaddr)
 * $ export UPDATES_PORT=4747
 * $ export EXPO_REPO_ROOT=<path to local expo repo>
 * $ export ARTIFACTS_DEST=<path to any temp artifacts dir>
 * $ export TEST_PROJECT_ROOT=<path to any temp dir for the project root>
 *
 * Then execute this file to setup the test project and builds.
 *
 * Afterwards, tests can be run by changing to TEST_PROJECT_ROOT and running
 *
 * eas init
 * eas build --profile=updates_testing --platform=<ios|android>
 */

(async function () {
  if (
    !process.env.ARTIFACTS_DEST ||
    !process.env.EXPO_REPO_ROOT ||
    !process.env.UPDATES_HOST ||
    !process.env.UPDATES_PORT
  ) {
    throw new Error(
      'Missing one or more environment variables; see instructions in e2e/__tests__/setup/index.js'
    );
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'updates-e2e');
  const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');

  await initAsync(projectRoot, { repoRoot, runtimeVersion, localCliBin });

  await setupAssetsAppAsync(projectRoot, localCliBin);
})();
