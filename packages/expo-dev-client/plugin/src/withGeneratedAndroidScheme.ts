import { AndroidConfig, AndroidManifest } from '@expo/config-plugins';
import { createAndroidManifestPlugin } from '@expo/config-plugins/build/plugins/android-plugins';
import { ExpoConfig } from '@expo/config-types';

import getDefaultScheme from './getDefaultScheme';

export default createAndroidManifestPlugin(setGeneratedAndroidScheme, 'withGeneratedAndroidScheme');

export function setGeneratedAndroidScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  androidManifest: AndroidManifest
): AndroidManifest {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = getDefaultScheme(config);
  return AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
}
