import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins';

import { createLegacyPlugin } from '../createLegacyPlugin';

export const withNotificationError: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      if ('notification' in config) {
        throw new Error(
          'The `notification` property in app config is no longer supported. Use the `expo-notifications` config plugin instead.'
        );
      }
      return config;
    },
  ]);
};

export default createLegacyPlugin({
  packageName: 'expo-notifications',
  fallback: [
    // Android
    withNotificationError,
    // iOS
    // Automatic setting of APNS entitlement is no longer needed
  ],
});
