const {
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
} = require('./getPlatformPreset');
const { getWatchPlugins, withWatchPlugins } = require('./withWatchPlugins');

module.exports = {
  getWatchPlugins,
  withWatchPlugins,
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
};
