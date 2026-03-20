import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('../../package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

export type Props = {
  /**
   * A string to set the `NSMotionUsageDescription` permission message, or `false` to disable.
   * @default "Allow $(PRODUCT_NAME) to access your device motion"
   * @platform ios
   */
  motionPermission?: string | false;
};

const withSensors: ConfigPlugin<Props | void> = (config, { motionPermission } = {}) => {
  if (motionPermission === false) {
    config = withPodfileProperties(config, (config) => {
      config.modResults.MOTION_PERMISSION = 'false';
      return config;
    });
  }

  return IOSConfig.Permissions.createPermissionsPlugin({
    NSMotionUsageDescription: MOTION_USAGE,
  })(config, {
    NSMotionUsageDescription: motionPermission,
  });
};

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
