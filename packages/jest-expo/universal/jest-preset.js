const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('../src/getPlatformPreset');
module.exports = {
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
    require.resolve('jest-watch-select-projects'),
  ],
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    getNodePreset(),
    getIOSPreset(),
    getAndroidPreset(),
  ],
};
