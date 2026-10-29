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
  ],
});
