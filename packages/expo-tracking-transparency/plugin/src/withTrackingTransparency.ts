import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-tracking-transparency/package.json');

const DEFAULT_NSUserTrackingUsageDescription =
  'Allow this app to collect app-related data that can be used for tracking you or your device.';

const withTrackingTransparency: ConfigPlugin<
  {
    /**
     * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`. Omitting a
     * description will result in using the default permission message.
     * @default 'Allow this app to collect app-related data that can be used for tracking you or your
     * device.'
     */
    userTrackingPermission?: string | false;
  } | void
> = (config, props) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSUserTrackingUsageDescription: DEFAULT_NSUserTrackingUsageDescription,
  })(config, {
    NSUserTrackingUsageDescription: props?.userTrackingPermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'com.google.android.gms.permission.AD_ID',
  ]);
};

export default createRunOncePlugin(withTrackingTransparency, pkg.name, pkg.version);
