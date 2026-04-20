import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

export type Props = {
  /**
   * Whether to add location permissions to `AndroidManifest.xml` and `Info.plist`.
   * @default false
   */
  requestLocationPermission?: boolean;
  /**
   * A string to set the `NSLocationWhenInUseUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to access your location"
   * @platform ios
   */
  locationPermission?: string;
};

const withMapsLocation: ConfigPlugin<Props | void> = (
  config,
  { requestLocationPermission, locationPermission } = {}
) => {
  // Don't add the permissions if requestLocationPermission is not set explicity
  if (!requestLocationPermission) {
    return config;
  }
  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
  })(config, {
    NSLocationWhenInUseUsageDescription: locationPermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
  ]);
};

export default createRunOncePlugin(withMapsLocation, pkg.name, pkg.version);
