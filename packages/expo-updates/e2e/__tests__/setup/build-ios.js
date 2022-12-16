const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

const { ExpoRunFormatter } = require('@expo/xcpretty');

async function buildAsync(projectRoot, destinationFolder, fileSuffix) {
  const proc = spawnAsync(
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
    }
  );

  const formatter = ExpoRunFormatter.create(projectRoot, {
    isDebug: true,
  });

  proc.child.stdout.on('data', (data) => {
    const stringData = data.toString();

    for (const line of formatter.pipe(stringData)) {
      // Log parsed results.
      console.log(line);
    }
  });

  proc.child.stderr.on('data', (data) => {
    const stringData = data instanceof Buffer ? data.toString() : data;
    console.error(stringData);
  });

  const results = await proc;

  if (results.code === null || results.code === 75) {
    console.error('xcodebuild was cancelled or interrupted');
  }

  console.log(formatter.getBuildSummary());

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
