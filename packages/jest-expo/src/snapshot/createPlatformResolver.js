const path = require('path');

module.exports = (platform) => {
  const getExt = (ext) => `${ext}.${platform}`;
  return {
    resolveSnapshotPath: (testPath, snapshotExtension) =>
      path.join(
        path.join(path.dirname(testPath), '__snapshots__'),
        path.basename(testPath) + getExt(snapshotExtension)
      ),

    resolveTestPath: (snapshotFilePath, snapshotExtension) =>
      snapshotFilePath.replace('__snapshots__/', '').slice(0, -getExt(snapshotExtension).length),

    testPathForConsistencyCheck: path.posix.join(
      'consistency_check',
      '__tests__',
      'example.test.js'
    ),
  };
};
