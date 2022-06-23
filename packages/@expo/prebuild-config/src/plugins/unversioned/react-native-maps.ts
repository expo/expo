import { AndroidConfig, ConfigPlugin, IOSConfig, withInfoPlist } from '@expo/config-plugins';
import resolveFrom from 'resolve-from';

import { createLegacyPlugin } from './createLegacyPlugin';

const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

// Copied from expo-location package, this gets used when the
// user has react-native-maps installed but not expo-location.
const withDefaultLocationPermissions: ConfigPlugin = config => {
  const isLinked =
    !config._internal?.autolinkedModules ||
    config._internal.autolinkedModules.includes('react-native-maps');
  // Only add location permissions if react-native-maps is installed.
  if (
    config._internal?.projectRoot &&
    resolveFrom.silent(config._internal.projectRoot, 'react-native-maps') &&
    isLinked
  ) {
    config = withInfoPlist(config, config => {
      config.modResults.NSLocationWhenInUseUsageDescription =
        config.modResults.NSLocationWhenInUseUsageDescription || LOCATION_USAGE;
      return config;
    });

    return AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ]);
  }
  return config;
};

export default createLegacyPlugin({
  packageName: 'react-native-maps',
  fallback: [
    AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey,
    IOSConfig.Maps.withMaps,
    withDefaultLocationPermissions,
  ],
});
