import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withAppleAuthIOS: ConfigPlugin = config => {
  if (!config.ios) config.ios = {};
  // Statically setting the entitlements outside of the entitlements mod so tools like eas-cli
  // can determine which capabilities to enable before building the app.
  config.ios.entitlements = setAppleAuthEntitlements(config, config.ios.entitlements || {});
  return config;
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
