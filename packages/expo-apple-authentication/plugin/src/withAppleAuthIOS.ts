import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withAppleAuthIOS: ConfigPlugin = config => {
  return withEntitlementsPlist(config, config => {
    config.modResults = setAppleAuthEntitlements(config, config.modResults);

    return config;
  });
};

export function setAppleAuthEntitlements(
  config: Pick<ExpoConfig, 'ios'>,
  entitlements: Record<string, any>
): Record<string, any> {
  if (config.ios?.usesAppleSignIn) {
    entitlements['com.apple.developer.applesignin'] = ['Default'];
  }
  return entitlements;
}
