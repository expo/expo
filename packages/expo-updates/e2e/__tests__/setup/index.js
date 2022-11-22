const path = require('path');

const { buildAsync: buildAndroidAsync } = require('./build-android');
const { buildAsync: buildIosAsync } = require('./build-ios');
const { initAsync, setupBasicAppAsync, setupAssetsAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const artifactsDest = process.env.ARTIFACTS_DEST;

const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

/**
 * To setup e2e tests locally, export the following environment variables:
 * $ export UPDATES_HOST=$(ifconfig -l | xargs -n1 ipconfig getifaddr)
 * $ export UPDATES_PORT=4747
 * $ export EXPO_REPO_ROOT=<path to local expo repo>
 * $ export ARTIFACTS_DEST=<path to any temp artifacts dir>
 * $ export TEST_PROJECT_ROOT=<path to any temp dir for the project root>
 *
 * Then execute this file to setup the test project and builds.
 *
 * Afterwards, tests can be run on a booted simulator or (Android) connected device with
 * $ yarn test --config packages/expo-updates/e2e/jest.config.android.js --runInBand
 * $ yarn test --config packages/expo-updates/e2e/jest.config.ios.js --runInBand
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

  // Order is somewhat important here as the `basic` and `assets` apps are created by modifying the
  // same project (not creating a new one).
  await setupBasicAppAsync(projectRoot, localCliBin);
  await buildAndroidAsync(projectRoot, artifactsDest, 'basic');
  await buildIosAsync(projectRoot, artifactsDest, 'basic');

  await setupAssetsAppAsync(projectRoot, localCliBin);
  await buildAndroidAsync(projectRoot, artifactsDest, 'assets');
  await buildIosAsync(projectRoot, artifactsDest, 'assets');

  // build the same app a second time for tests involving overwriting installation
  await buildAndroidAsync(projectRoot, artifactsDest, 'assets2');
  await buildIosAsync(projectRoot, artifactsDest, 'assets2');
})();
