const {
  getWebPreset,
  //   getNodePreset,
  getIOSPreset,
  //   getAndroidPreset,
} = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');

function withDefaults(config) {
  return {
    ...config,
    roots: ['src'],
    setupFilesAfterEnv: ['./build/testing-library/mocks.js'],
  };
}

module.exports = withWatchPlugins({
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    // getNodePreset(),
    getIOSPreset(),
    //   getAndroidPreset(),
  ].map(withDefaults),
});
