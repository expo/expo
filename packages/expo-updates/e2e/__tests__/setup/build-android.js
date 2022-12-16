const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

async function buildAsync(projectRoot, destinationFolder, fileSuffix) {
  await spawnAsync('./gradlew', ['assembleRelease', '--stacktrace'], {
    cwd: path.join(projectRoot, 'android'),
    stdio: 'inherit',
  });
  const destinationPath = path.join(destinationFolder, `android-release-${fileSuffix}.apk`);
  await fs.copyFile(
    path.join(
      projectRoot,
      'android',
      'app',
      'build',
      'outputs',
      'apk',
      'release',
      'app-release.apk'
    ),
    destinationPath
  );
  return destinationPath;
}

module.exports = {
  buildAsync,
};
