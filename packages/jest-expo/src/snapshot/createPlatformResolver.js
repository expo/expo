const path = require('path');

module.exports = (platform, { isReactServer } = {}) => {
  const testDirectory = isReactServer ? '__rsc_tests__' : `__tests__`;
  const customPath = path.join(testDirectory, '__snapshots__');
  const getExt = (ext) => `${ext}.${platform}`;
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
