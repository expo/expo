const { createRunOncePlugin } = require('@expo/config-plugins');

const withSensors = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { motionPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSMotionUsageDescription =
    motionPermission ||
    config.ios.infoPlist.NSMotionUsageDescription ||
    'Allow $(PRODUCT_NAME) to use your device motion';

  return config;
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withSensors, pkg.name, pkg.version);
