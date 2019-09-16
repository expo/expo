const { getWatchPlugins, withWatchPlugins } = require('./withWatchPlugins');
const {
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
} = require('./getPlatformPreset');

module.exports = {
  getWatchPlugins,
  withWatchPlugins,
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
};
