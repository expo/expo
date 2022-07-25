const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

async function buildAsync(projectRoot, destinationFolder, fileSuffix) {
  await spawnAsync(
    'xcodebuild',
    [
      '-workspace',
      'updatese2e.xcworkspace',
      '-scheme',
      'updatese2e',
      '-configuration',
      'Release',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      './build',
      'build',
    ],
    {
      cwd: path.join(projectRoot, 'ios'),
      stdio: 'inherit',
    }
  );
  const destinationPath = path.join(destinationFolder, `ios-release-${fileSuffix}.app`);
  await fs.cp(
    path.join(
      projectRoot,
      'ios',
      'build',
      'Build',
      'Products',
      'Release-iphonesimulator',
      'updatese2e.app'
    ),
    destinationPath,
    { recursive: true }
  );
  return destinationPath;
}

module.exports = {
  buildAsync,
};
