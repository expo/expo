import { IOSConfig, InfoPlist } from '@expo/config-plugins';
import { createInfoPlistPlugin } from '@expo/config-plugins/build/plugins/ios-plugins';
import { ExpoConfig } from '@expo/config-types';

import generateScheme from './generateScheme';

export default createInfoPlistPlugin(setGeneratedIosScheme, 'withGeneratedIosScheme');

export function setGeneratedIosScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  infoPlist: InfoPlist
): IOSConfig.InfoPlist {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = generateScheme(config);
  const result = IOSConfig.Scheme.appendScheme(scheme, infoPlist);
  return result;
}
