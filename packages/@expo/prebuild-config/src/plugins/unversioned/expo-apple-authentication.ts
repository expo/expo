import { ConfigPlugin, WarningAggregator, withEntitlementsPlist } from '@expo/config-plugins';

import { createLegacyPlugin } from './createLegacyPlugin';

const withAppleSignInWarning: ConfigPlugin = config => {
  return withEntitlementsPlist(config, config => {
    if (config.ios?.usesAppleSignIn) {
      WarningAggregator.addWarningIOS(
        'ios.usesAppleSignIn',
        'Install expo-apple-authentication to enable this feature',
        'https://docs.expo.dev/versions/latest/sdk/apple-authentication/#eas-build'
      );
    }

    return config;
  });
};

export default createLegacyPlugin({
  packageName: 'expo-apple-authentication',
  fallback: withAppleSignInWarning,
});
