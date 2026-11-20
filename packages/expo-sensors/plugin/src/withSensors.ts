import {
  ConfigPlugin,
  createRunOncePlugin,
  InfoPlist,
  IOSConfig,
  withInfoPlist,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('../../package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

// Read by `MotionPermissionRequester.isMotionPermissionDisabled` in the iOS module (do not change).
export const DISABLE_MOTION_PERMISSION_KEY = 'ExpoSensors_disableMotionPermission';

export type Props = {
  /**
   * A string to set the `NSMotionUsageDescription` permission message, or `false` to disable.
   * @default "Allow $(PRODUCT_NAME) to access your device motion"
   * @platform ios
   */
  motionPermission?: string | false;
};

export function setMotionPermissionDisabled(
  { motionPermission }: Props,
  infoPlist: InfoPlist
): InfoPlist {
  if (motionPermission === false) {
    infoPlist[DISABLE_MOTION_PERMISSION_KEY] = true;
  } else {
    delete infoPlist[DISABLE_MOTION_PERMISSION_KEY];
  }
  return infoPlist;
}

const withSensors: ConfigPlugin<Props | void> = (config, { motionPermission } = {}) => {
  if (motionPermission === false) {
    config = withPodfileProperties(config, (config) => {
      config.modResults.MOTION_PERMISSION = 'false';
      return config;
    });
  }

  config = withInfoPlist(config, (config) => {
    config.modResults = setMotionPermissionDisabled({ motionPermission }, config.modResults);
    return config;
  });

  return IOSConfig.Permissions.createPermissionsPlugin({
    NSMotionUsageDescription: MOTION_USAGE,
  })(config, {
    NSMotionUsageDescription: motionPermission,
  });
};

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
