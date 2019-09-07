const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('../utils/getPlatformPreset');
const { withWatchPlugins } = require('../utils/withWatchPlugins');

module.exports = withWatchPlugins({
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    getNodePreset(),
    getIOSPreset(),
    getAndroidPreset(),
  ],
});
