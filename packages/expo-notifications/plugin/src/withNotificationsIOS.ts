import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from '@expo/config-plugins';

/**
 * Add `remote-notification` to UIBackgroundModes in the iOS Info.plist.
 *
 * Without this, you'll see the runtime warning:
 * You've implemented `-[<UIApplicationDelegate> application:didReceiveRemoteNotification:fetchCompletionHandler:]`, but you still need to add "remote-notification" to the list of your supported UIBackgroundModes in your Info.plist.
 *
 * @param config
 */
export const withRemoteNotificationBackgroundMode: ConfigPlugin = config => {
  return withInfoPlist(config, config => {
    const infoPlist = config.modResults as any;
    if (!Array.isArray(infoPlist.UIBackgroundModes)) {
      infoPlist.UIBackgroundModes = [];
    }
    if (!infoPlist.UIBackgroundModes.includes('remote-notification')) {
      infoPlist.UIBackgroundModes.push('remote-notification');
    }
    config.modResults = infoPlist;
    return config;
  });
};

export const withNotificationsIOS: ConfigPlugin<{ mode: 'production' | 'development' }> = (
  config,
  { mode }
) => {
  config = withRemoteNotificationBackgroundMode(config);

  return withEntitlementsPlist(config, config => {
    config.modResults['aps-environment'] = mode;
    return config;
  });
};
