const path = require('path');

const testDirectory = `__tests__`;
module.exports = (platform, { isReactServer } = {}) => {
  const customPath = path.join(testDirectory, '__snapshots__');
  const getExt = (ext) => {
    let extension = `${ext}.${platform}`;
    if (isReactServer) {
      extension = `rsc+${extension}`;
    }
    return extension;
  };
  return {
    resolveSnapshotPath: (testPath, snapshotExtension) => {
      const snapshotFilePath =
        testPath.replace(testDirectory, customPath) + getExt(snapshotExtension);
      return snapshotFilePath;
    },

    resolveTestPath: (snapshotFilePath, snapshotExtension) => {
      const testPath = snapshotFilePath
        .replace(customPath, testDirectory)
        .slice(0, -getExt(snapshotExtension).length);
      return testPath;
    },

    testPathForConsistencyCheck: path.posix.join(
      'consistency_check',
      testDirectory,
      'example.test.js'
    ),
  };
};
