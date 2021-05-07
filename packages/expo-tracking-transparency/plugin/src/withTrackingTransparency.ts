import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

const pkg = require('expo-tracking-transparency/package.json');

const DEFAULT_NSUserTrackingUsageDescription =
  'This will allow the app to gather app-related data that can be used for tracking you or your device.';

const withTrackingTransparency: ConfigPlugin<{
  /**
   * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`.
   * Passing `false` will skip adding the permission.
   * @default 'This will allow the app to gather app-related data that can be used for tracking you or your device.'
   */
  userTrackingPermission?: string | false;
} | void> = (config, props) => {
  config = withUserTrackingPermission(config, props);
  return config;
};

export const withUserTrackingPermission: ConfigPlugin<{
  userTrackingPermission?: string | false;
} | void> = (config, { userTrackingPermission } = {}) => {
  if (userTrackingPermission === false) {
    if (config && config.ios && config.ios.infoPlist) {
      delete config.ios.infoPlist.NSUserTrackingUsageDescription;
    }
    return config;
  }
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSUserTrackingUsageDescription =
    userTrackingPermission ||
    config.ios.infoPlist.NSUserTrackingUsageDescription ||
    DEFAULT_NSUserTrackingUsageDescription;

  return config;
};

export default createRunOncePlugin(withTrackingTransparency, pkg.name, pkg.version);
