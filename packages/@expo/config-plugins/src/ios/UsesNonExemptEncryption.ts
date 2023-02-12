import { ExpoConfig } from '@expo/config-types';

import { createInfoPlistPluginWithPropertyGuard } from '../plugins/ios-plugins';
import { InfoPlist } from './IosConfig.types';

export const withUsesNonExemptEncryption = createInfoPlistPluginWithPropertyGuard(
  setUsesNonExemptEncryption,
  {
    infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
    expoConfigProperty: 'ios.config.usesNonExemptEncryption',
  },
  'withUsesNonExemptEncryption'
);

export function getUsesNonExemptEncryption(config: Pick<ExpoConfig, 'ios'>) {
  return config?.ios?.config?.usesNonExemptEncryption ?? null;
}

export function setUsesNonExemptEncryption(
  config: Pick<ExpoConfig, 'ios'>,
  { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist
): InfoPlist {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(config);

  // Make no changes if the key is left blank
  if (usesNonExemptEncryption === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    ITSAppUsesNonExemptEncryption: usesNonExemptEncryption,
  };
}
