const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  IOSConfig,
} = require('@expo/config-plugins');

const withLocation = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  {
    locationAlwaysAndWhenInUsePermission = 'Allow $(PRODUCT_NAME) to use your location',
    locationAlwaysPermission = 'Allow $(PRODUCT_NAME) to use your location',
    locationWhenInUsePermission = 'Allow $(PRODUCT_NAME) to use your location',
  } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSLocationAlwaysAndWhenInUseUsageDescription: locationAlwaysAndWhenInUsePermission || null,
        NSLocationAlwaysUsageDescription: locationAlwaysPermission || null,
        NSLocationWhenInUseUsageDescription: locationWhenInUsePermission || null,
      },
    ],
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

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withLocation, pkg.name, pkg.version);
