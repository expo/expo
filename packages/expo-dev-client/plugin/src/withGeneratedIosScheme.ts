import { IOSConfig, InfoPlist, withInfoPlist } from '@expo/config-plugins';
import { createInfoPlistPlugin } from '@expo/config-plugins/build/plugins/ios-plugins';
import { ExpoConfig } from '@expo/config-types';

import generateScheme from './generateScheme';

export default createInfoPlistPlugin(setGeneratedIosScheme, 'withGeneratedIosScheme');

export function setGeneratedIosScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  infoPlist: InfoPlist
): IOSConfig.InfoPlist {
  if (!config.scheme) {
    // No cross-platform scheme specified in configuration,
    // generate one to be used for launching the dev client.
    const scheme = generateScheme(config);
    const result = IOSConfig.Scheme.appendScheme(scheme, infoPlist);
    return result;
  }
  return infoPlist;
}
