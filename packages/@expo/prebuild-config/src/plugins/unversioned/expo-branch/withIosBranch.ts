import { ConfigPlugin, InfoPlist, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withIosBranch: ConfigPlugin = config => {
  return withInfoPlist(config, config => {
    config.modResults = setBranchApiKey(config, config.modResults);
    return config;
  });
};

export function getBranchApiKey(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.config?.branch?.apiKey ?? null;
}

export function setBranchApiKey(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist {
  const apiKey = getBranchApiKey(config);

  if (apiKey === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    branch_key: {
      live: apiKey,
    },
  };
}
