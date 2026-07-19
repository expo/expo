const { withWatchPlugins } = require('jest-expo/config');
const {
  getIOSPreset,
  getAndroidPreset,
  getWebPreset,
} = require('jest-expo/config/getPlatformPreset');

module.exports = withWatchPlugins({
  projects: [
    getIOSPreset({ isReactServer: true }),
    getAndroidPreset({ isReactServer: true }),
    getWebPreset({ isReactServer: true }),
    // Remove sub-watch-plugins from the preset when using multi-project runner.
  ].map(({ watchPlugins, ...config }) => config),
  // See: https://jestjs.io/docs/configuration#prettierpath-string
  prettierPath: require.resolve('jest-snapshot-prettier'),
});
