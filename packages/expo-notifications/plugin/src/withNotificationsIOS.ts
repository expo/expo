import { ConfigPlugin } from '@expo/config-plugins';

export const withNotificationsIOS: ConfigPlugin<{ mode: 'production' | 'development' }> = (
  config,
  { mode }
) => {
  // Statically setting the entitlements outside of the entitlements mod so tools like eas-cli
  // can determine which capabilities to enable before building the app.

  if (!config.ios) config.ios = {};
  if (!config.ios.entitlements) config.ios.entitlements = {};
  config.ios.entitlements['aps-environment'] = mode;

  return config;
};
