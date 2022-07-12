const path = require('path');

const { buildAsync: buildAndroidAsync } = require('./build-android');
const { buildAsync: buildIosAsync } = require('./build-ios');
const { initAsync, setupBasicAppAsync, setupAssetsAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const artifactsDest = process.env.ARTIFACTS_DEST;

const workingDir = path.resolve(repoRoot, '..');
const runtimeVersion = '1.0.0';

(async function () {
  // const projectRoot = await initAsync(workingDir, repoRoot, runtimeVersion);

  // await setupBasicAppAsync(projectRoot);
  // await buildAndroidAsync(projectRoot, artifactsDest, 'basic');
  // await buildIosAsync(projectRoot, artifactsDest, 'basic');

  // await setupAssetsAppAsync(projectRoot);
  const projectRoot = path.resolve(repoRoot, '..', 'updates-e2e');
  // await buildAndroidAsync(projectRoot, artifactsDest, 'assets');
  await buildIosAsync(projectRoot, artifactsDest, 'assets');

  // build the same app a second time for tests involving overwriting installation
  // await buildAndroidAsync(projectRoot, artifactsDest, 'assets2');
  await buildIosAsync(projectRoot, artifactsDest, 'assets2');
})();
