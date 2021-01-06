const pkg = require('./package.json');
const { createRunOncePlugin } = require('@expo/config-plugins');

const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

const withSensors = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { motionPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSMotionUsageDescription =
    motionPermission || config.ios.infoPlist.NSMotionUsageDescription || MOTION_USAGE;

  return config;
};

module.exports = createRunOncePlugin(withSensors, pkg.name, pkg.version);
