import { ExpoConfig } from '@expo/config-types';

import { InfoPlist } from './AppleConfig.types';
import { createInfoPlistPluginWithPropertyGuard } from '../plugins/apple-plugins';

export const withUsesNonExemptEncryption = (applePlatform: 'ios' | 'macos') =>
  createInfoPlistPluginWithPropertyGuard(applePlatform)(
    (
      config: Pick<ExpoConfig, typeof applePlatform>,
      { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist
    ) => setUsesNonExemptEncryption(applePlatform, config, infoPlist),
    {
      infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
      expoConfigProperty: `${applePlatform}.config.usesNonExemptEncryption`,
    },
    'withUsesNonExemptEncryption'
  );

export function getUsesNonExemptEncryption(
  applePlatform: 'ios' | 'macos',
  config: Pick<ExpoConfig, typeof applePlatform>
) {
  return config?.[applePlatform]?.config?.usesNonExemptEncryption ?? null;
}

export function setUsesNonExemptEncryption(
  applePlatform: 'ios' | 'macos',
  config: Pick<ExpoConfig, typeof applePlatform>,
  { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist
): InfoPlist {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(applePlatform, config);

  // Make no changes if the key is left blank
  if (usesNonExemptEncryption === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    ITSAppUsesNonExemptEncryption: usesNonExemptEncryption,
  };
}
