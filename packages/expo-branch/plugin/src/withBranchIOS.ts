import { InfoPlist } from '@expo/config-plugins/build/ios/IosConfig.types';
import { createInfoPlistPlugin } from '@expo/config-plugins/build/plugins/ios-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withBranchIOS = createInfoPlistPlugin(setBranchApiKey, 'withBranchIOS');

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
