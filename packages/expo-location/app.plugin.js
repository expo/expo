const pkg = require('./package.json');
const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

const withLocation = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  {
    locationAlwaysAndWhenInUsePermission,
    locationAlwaysPermission,
    locationWhenInUsePermission,
  } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
    locationAlwaysAndWhenInUsePermission ||
    config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription ||
    LOCATION_USAGE;
  config.ios.infoPlist.NSLocationAlwaysUsageDescription =
    locationAlwaysPermission ||
    config.ios.infoPlist.NSLocationAlwaysUsageDescription ||
    LOCATION_USAGE;
  config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
    locationWhenInUsePermission ||
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription ||
    LOCATION_USAGE;

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        // Optional
        'android.permission.ACCESS_BACKGROUND_LOCATION',
      ],
    ],
  ]);
};

module.exports = createRunOncePlugin(withLocation, pkg.name, pkg.version);
