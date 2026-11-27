import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  InfoPlist,
  IOSConfig,
  withGradleProperties,
  withInfoPlist,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('../../package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

// Read by `MotionPermissionRequester.isMotionPermissionDisabled` in the iOS module (do not change).
export const DISABLE_MOTION_PERMISSION_KEY = 'ExpoSensors_disableMotionPermission';

// Read by `android/build.gradle` (do not change).
export const PEDOMETER_PLAY_SERVICES_KEY = 'expo.sensors.pedometer-play-services-enabled';

export type Props = {
  /**
   * A string to set the `NSMotionUsageDescription` permission message, or `false` to disable.
   * @default "Allow $(PRODUCT_NAME) to access your device motion"
   * @platform ios
   */
  motionPermission?: string | false;
  /**
   * Whether to include the Google Play services libraries that the pedometer step history needs.
   * They increase the app size.
   * @default false
   * @platform android
   */
  pedometerPlayServicesEnabled?: boolean;
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

export function setPedometerPlayServicesEnabled(
  { pedometerPlayServicesEnabled }: Props,
  gradleProperties: AndroidConfig.Properties.PropertiesItem[]
): AndroidConfig.Properties.PropertiesItem[] {
  return AndroidConfig.BuildProperties.updateAndroidBuildProperty(
    gradleProperties,
    PEDOMETER_PLAY_SERVICES_KEY,
    pedometerPlayServicesEnabled === true ? 'true' : null,
    { removePropWhenValueIsNull: true }
  );
}

const withSensors: ConfigPlugin<Props | void> = (
  config,
  { motionPermission, pedometerPlayServicesEnabled } = {}
) => {
  if (motionPermission === false) {
    config = withPodfileProperties(config, (config) => {
      config.modResults.MOTION_PERMISSION = 'false';
      return config;
    });
  }

  config = withGradleProperties(config, (config) => {
    config.modResults = setPedometerPlayServicesEnabled(
      { pedometerPlayServicesEnabled },
      config.modResults
    );
    return config;
  });

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
