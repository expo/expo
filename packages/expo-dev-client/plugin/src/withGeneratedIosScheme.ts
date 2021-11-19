import { IOSConfig, InfoPlist, withInfoPlist, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import getDefaultScheme from './getDefaultScheme';

export const withGeneratedIosScheme: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults = setGeneratedIosScheme(config, config.modResults);
    return config;
  });
};

export function setGeneratedIosScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  infoPlist: InfoPlist
): IOSConfig.InfoPlist {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = getDefaultScheme(config);

  if (!IOSConfig.Scheme.hasScheme(scheme, infoPlist)) {
    infoPlist = IOSConfig.Scheme.appendScheme(scheme, infoPlist);
  }
  return infoPlist;
}
