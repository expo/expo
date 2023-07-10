const {
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
} = require('./getPlatformPreset');
const { withTypescriptMapping } = require('./withTypescriptMapping');
const { getWatchPlugins, withWatchPlugins } = require('./withWatchPlugins');

module.exports = {
  getWatchPlugins,
  withWatchPlugins,
  withTypescriptMapping,
  getWebPreset,
  getIOSPreset,
  getAndroidPreset,
  getNodePreset,
};
