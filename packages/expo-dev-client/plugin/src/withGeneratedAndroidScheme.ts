import { AndroidConfig, AndroidManifest } from '@expo/config-plugins';
import { createAndroidManifestPlugin } from '@expo/config-plugins/build/plugins/android-plugins';
import { ExpoConfig } from '@expo/config-types';

import generateScheme from './generateScheme';

export default createAndroidManifestPlugin(setGeneratedAndroidScheme, 'withGeneratedAndroidScheme');

export function setGeneratedAndroidScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  androidManifest: AndroidManifest
): AndroidManifest {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = generateScheme(config);
  return AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
}
