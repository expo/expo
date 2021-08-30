import { IOSConfig, InfoPlist } from '@expo/config-plugins';
import { createInfoPlistPlugin } from '@expo/config-plugins/build/plugins/ios-plugins';
import { ExpoConfig } from '@expo/config-types';

import getDefaultScheme from './getDefaultScheme';

export default createInfoPlistPlugin(setGeneratedIosScheme, 'withGeneratedIosScheme');

export function setGeneratedIosScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  infoPlist: InfoPlist
): IOSConfig.InfoPlist {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = getDefaultScheme(config);
  const result = IOSConfig.Scheme.appendScheme(scheme, infoPlist);
  return result;
}
