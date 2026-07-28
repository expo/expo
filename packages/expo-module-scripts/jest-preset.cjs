const { withWatchPlugins } = require('jest-expo/config');

const createJestPreset = require('./createJestPreset.cjs');

module.exports = withWatchPlugins({
  // Don't fail a package that ships the preset but has no test files yet.
  passWithNoTests: true,
  ...require('jest-expo/config/maxWorkers'),
  projects: [
    createJestPreset(require('jest-expo/ios/jest-preset')),
    createJestPreset(require('jest-expo/android/jest-preset')),
    createJestPreset(require('jest-expo/web/jest-preset')),
    createJestPreset(require('jest-expo/node/jest-preset')),
    // Remove sub-watch-plugins from the preset when using multi-project runner.
  ].map(({ watchPlugins, ...config }) => config),

  // See: https://jestjs.io/docs/configuration#prettierpath-string
  prettierPath: require.resolve('jest-snapshot-prettier'),
});
