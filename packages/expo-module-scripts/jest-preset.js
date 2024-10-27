const { withWatchPlugins } = require('jest-expo/config');

const createJestPreset = require('./createJestPreset');

module.exports = withWatchPlugins({
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
