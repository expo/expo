const pkg = require('./package.json');
const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withAV = (config, { microphonePermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSMicrophoneUsageDescription =
    microphonePermission ||
    config.ios.infoPlist.NSMicrophoneUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your microphone';

  return withPlugins(config, [
    [AndroidConfig.Permissions.withPermissions, ['android.permission.RECORD_AUDIO']],
  ]);
};

module.exports = createRunOncePlugin(withAV, pkg.name, pkg.version);
