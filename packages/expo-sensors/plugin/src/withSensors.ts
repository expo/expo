import {
  AndroidConfig,
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
  /**
   * Whether to enable the `ACTIVITY_RECOGNITION` permission required for motion activity
   * tracking via `getPermissionsAsync` and `requestPermissionsAsync`.
   * @default false
   * @platform android
   */
  isAndroidMotionActivityEnabled?: boolean;
};

const withSensors: ConfigPlugin<Props | void> = (
  config,
  {
    motionPermission,
    isAndroidMotionActivityEnabled,
  } = {}
) => {
  if (motionPermission === false) {
    config = withPodfileProperties(config, (config) => {
      config.modResults.MOTION_PERMISSION = 'false';
      return config;
    });
  }

  IOSConfig.Permissions.createPermissionsPlugin({
    NSMotionUsageDescription: MOTION_USAGE,
  })(config, {
    NSMotionUsageDescription: motionPermission,
  });

  return AndroidConfig.Permissions.withPermissions(
    config,
    [
      isAndroidMotionActivityEnabled && 'android.permission.ACTIVITY_RECOGNITION',
    ].filter(Boolean) as string[]
  );
};

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
