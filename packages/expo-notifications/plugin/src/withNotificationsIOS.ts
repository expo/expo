import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

export const withNotificationsIOS: ConfigPlugin<{ mode: 'production' | 'development' }> = (
  config,
  { mode }
) => {
  return withEntitlementsPlist(config, config => {
    config.modResults['aps-environment'] = mode;
    return config;
  });
};
