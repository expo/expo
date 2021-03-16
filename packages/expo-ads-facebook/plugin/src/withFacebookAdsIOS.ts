import { ConfigPlugin } from '@expo/config-plugins';

const USER_TRACKING = 'Allow $(PRODUCT_NAME) to use data for tracking the user or the device';

export const withUserTrackingPermission: ConfigPlugin<{
  userTrackingPermission?: string;
} | void> = (config, { userTrackingPermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSUserTrackingUsageDescription =
    userTrackingPermission || config.ios.infoPlist.NSUserTrackingUsageDescription || USER_TRACKING;

  return config;
};
