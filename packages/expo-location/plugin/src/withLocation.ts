import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-location/package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

const withBackgroundLocation: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('location')) {
      config.modResults.UIBackgroundModes.push('location');
    }
    return config;
  });
};

const withLocation: ConfigPlugin<
  {
    locationAlwaysAndWhenInUsePermission?: string;
    locationAlwaysPermission?: string;
    locationWhenInUsePermission?: string;
    isIosBackgroundLocationEnabled?: boolean;
    isAndroidBackgroundLocationEnabled?: boolean;
  } | void
> = (
  config,
  {
    locationAlwaysAndWhenInUsePermission,
    locationAlwaysPermission,
    locationWhenInUsePermission,
    isIosBackgroundLocationEnabled,
    isAndroidBackgroundLocationEnabled,
  } = {}
) => {
  if (isIosBackgroundLocationEnabled) {
    config = withBackgroundLocation(config);
  }

  config = withInfoPlist(config, (config) => {
    config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription =
      locationAlwaysAndWhenInUsePermission ||
      config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription ||
      LOCATION_USAGE;
    config.modResults.NSLocationAlwaysUsageDescription =
      locationAlwaysPermission ||
      config.modResults.NSLocationAlwaysUsageDescription ||
      LOCATION_USAGE;
    config.modResults.NSLocationWhenInUseUsageDescription =
      locationWhenInUsePermission ||
      config.modResults.NSLocationWhenInUseUsageDescription ||
      LOCATION_USAGE;

    return config;
  });

  return AndroidConfig.Permissions.withPermissions(
    config,
    [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      // Optional
      isAndroidBackgroundLocationEnabled && 'android.permission.ACCESS_BACKGROUND_LOCATION',
    ].filter(Boolean) as string[]
  );
};

export default createRunOncePlugin(withLocation, pkg.name, pkg.version);
