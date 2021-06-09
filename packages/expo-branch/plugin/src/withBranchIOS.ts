import { ConfigPlugin, InfoPlist, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withBranchIOS: ConfigPlugin<{ apiKey?: string }> = (config, { apiKey }) => {
  const key = apiKey ?? getBranchApiKey(config);
  // Apply the property to the static location in the Expo config
  // for any Expo Go tooling that might expect it to be in a certain location.
  if (key != null) {
    if (!config.ios) config.ios = {};
    if (!config.ios.config) config.ios.config = {};
    if (!config.ios.config.branch) config.ios.config.branch = {};
    config.ios.config.branch.apiKey = key;
  }

  return withInfoPlist(config, config => {
    config.modResults = setBranchApiKey(key, config.modResults);
    return config;
  });
};

export function getBranchApiKey(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.config?.branch?.apiKey ?? null;
}

export function setBranchApiKey(apiKey: string | null, infoPlist: InfoPlist): InfoPlist {
  if (apiKey == null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    branch_key: {
      live: apiKey,
    },
  };
}
