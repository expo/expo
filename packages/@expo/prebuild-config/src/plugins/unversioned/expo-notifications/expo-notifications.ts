import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

import { createLegacyPlugin } from '../createLegacyPlugin';
import {
  withNotificationIconColor,
  withNotificationIcons,
  withNotificationManifest,
} from './withAndroidNotifications';

const withNotificationsEntitlement: ConfigPlugin<'production' | 'development'> = (config, mode) => {
  return withEntitlementsPlist(config, config => {
    config.modResults['aps-environment'] = mode;
    return config;
  });
};

export default createLegacyPlugin({
  packageName: 'expo-notifications',
  fallback: [
    // Android
    withNotificationManifest,
    withNotificationIconColor,
    withNotificationIcons,
    // iOS
    [withNotificationsEntitlement, 'development'],
  ],
});
