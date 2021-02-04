import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
} from '@expo/config-plugins';

const pkg = require('expo-sensors/package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';

const withSensors: ConfigPlugin<{ motionPermission?: string } | void> = (
  config,
  { motionPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSMotionUsageDescription =
    motionPermission || config.ios.infoPlist.NSMotionUsageDescription || MOTION_USAGE;

  return withAndroidFeature(config);
};

const withAndroidFeature: ConfigPlugin = config => {
  return withAndroidManifest(config, config => {
    config.modResults = setAndroidManifestFeatures(config.modResults);
    return config;
  });
};

/**
 * Add the following to the AndroidManifest.xml <uses-feature android:name="android.hardware.sensor.compass" android:required="true" />
 *
 * @param androidManifest
 */
export function setAndroidManifestFeatures(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
) {
  if (!Array.isArray(androidManifest.manifest['uses-feature'])) {
    androidManifest.manifest['uses-feature'] = [];
  }
  if (
    !androidManifest.manifest['uses-feature'].find(
      feature => feature.$['android:name'] === 'android.hardware.sensor.compass'
    )
  ) {
    androidManifest.manifest['uses-feature'].push({
      $: {
        'android:name': 'android.hardware.sensor.compass',
        'android:required': 'true',
      },
    });
  }

  return androidManifest;
}

export default createRunOncePlugin(withSensors, pkg.name, pkg.version);
