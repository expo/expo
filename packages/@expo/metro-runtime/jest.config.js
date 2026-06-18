const createJestPreset = require('expo-module-scripts/createJestPreset');
const {
  getWebPreset,
  //   getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');

function withDefaults({ watchPlugins, ...config }) {
  return {
    ...config,
    clearMocks: true,
    roots: ['src'],
  };
}

module.exports = withWatchPlugins({
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    // getNodePreset(),
    getIOSPreset(),
    getAndroidPreset(),
  ]
    .map(createJestPreset)
    .map(withDefaults),
});
