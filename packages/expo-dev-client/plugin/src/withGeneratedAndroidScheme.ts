import {
  AndroidConfig,
  AndroidManifest,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import getDefaultScheme from './getDefaultScheme';

export const withGeneratedAndroidScheme: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = setGeneratedAndroidScheme(config, config.modResults);
    return config;
  });
};

export function setGeneratedAndroidScheme(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  androidManifest: AndroidManifest
): AndroidManifest {
  // Generate a cross-platform scheme used to launch the dev client.
  const scheme = getDefaultScheme(config);
  if (!AndroidConfig.Scheme.hasScheme(scheme, androidManifest)) {
    androidManifest = AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
  }
  return androidManifest;
}
