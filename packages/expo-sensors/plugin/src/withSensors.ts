import { ConfigPlugin, createRunOncePlugin, withInfoPlist } from 'expo/config-plugins';

const pkg = require('expo-sensors/package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

const withSensors: ConfigPlugin<{ motionPermission?: string } | void> = (
  config,
  { motionPermission } = {}
) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSMotionUsageDescription =
      motionPermission || config.modResults.NSMotionUsageDescription || MOTION_USAGE;
    return config;
  });

  return config;
};

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
