import {
  withNotificationIconColor,
  withNotificationIcons,
  withNotificationManifest,
} from './withAndroidNotifications';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-notifications',
  fallback: [
    // Android
    withNotificationManifest,
    withNotificationIconColor,
    withNotificationIcons,
    // iOS
    // Automatic setting of APNS entitlement is no longer needed
  ],
});
