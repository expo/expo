const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
  withWatchPlugins,
} = require('jest-expo/config');

module.exports = withWatchPlugins({
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    getNodePreset(),
    getIOSPreset(),
    getAndroidPreset(),
  ],
});
