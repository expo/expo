import { ConfigPlugin, createRunOncePlugin, IOSConfig } from 'expo/config-plugins';

const pkg = require('expo-sensors/package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

const withSensors: ConfigPlugin<{ motionPermission?: string | false } | void> = (
  config,
  { motionPermission } = {}
) => {
  return IOSConfig.Permissions.createPermissionsPlugin({
    NSMotionUsageDescription: MOTION_USAGE,
  })(config, {
    NSMotionUsageDescription: motionPermission,
  });
};

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
