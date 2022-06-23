import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withAndroidManifestIcons: ConfigPlugin = config =>
  withAndroidManifest(config, config => {
    config.modResults = setRoundIconManifest(config, config.modResults);
    return config;
  });

export function setRoundIconManifest(
  config: Pick<ExpoConfig, 'android'>,
  manifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const isAdaptive = !!config.android?.adaptiveIcon;
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  if (isAdaptive) {
    application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
  } else {
    delete application.$['android:roundIcon'];
  }
  return manifest;
}
