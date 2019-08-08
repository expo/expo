const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('../src/getPlatformPreset');
module.exports = {
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    getNodePreset(),
    getIOSPreset(),
    getAndroidPreset(),
  ],
};
