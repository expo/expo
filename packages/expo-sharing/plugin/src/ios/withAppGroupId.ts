import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from '@expo/config-plugins';

export const withAppGroupId: ConfigPlugin<string> = (config, appGroupId) => {
  // Add do entitlements
  config = withEntitlementsPlist(config, async (config) => {
    const appGroups = config.modResults['com.apple.security.application-groups'] as
      | string[]
      | undefined;

    if (!appGroups) {
      config.modResults['com.apple.security.application-groups'] = [appGroupId];
      return config;
    }

    if (!appGroups.includes(appGroupId)) {
      config.modResults['com.apple.security.application-groups'] = [...appGroups, appGroupId];
    }

    return config;
  });

  // Add to Info.plist
  return withInfoPlist(config, (config) => {
    config.modResults['ExpoShareIntoAppGroupId'] = appGroupId;
    return config;
  });
};
