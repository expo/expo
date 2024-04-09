import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

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
    userTrackingPermission?: string;
  } | void
> = (config, props) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSUserTrackingUsageDescription =
      props?.userTrackingPermission ||
      config.modResults.NSUserTrackingUsageDescription ||
      DEFAULT_NSUserTrackingUsageDescription;
    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'com.google.android.gms.permission.AD_ID',
  ]);
};

export default createRunOncePlugin(withTrackingTransparency, pkg.name, pkg.version);
