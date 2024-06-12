const path = require('path');

const testDirectory = `__tests__`;
module.exports = (platform, { isReactServer } = {}) => {
  const customPath = path.join(testDirectory, '__snapshots__');
  const getExt = (ext) => {
    if (isReactServer) {
      // foo.test.web => foo.test.web+rsc.web.snap
      // bar-test => bar-test+rsc.web.snap
      return `+rsc.${platform}${ext}`;
    }
    // TODO: Fix this in a breaking change so `.snap` is the end of the file.
    return `${ext}.${platform}`;
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
