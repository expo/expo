import type { ExpoConfig } from '@expo/config-types';

import type { ConfigPlugin } from '../Plugin.types';
import { withAndroidManifest } from '../plugins/android-plugins';
import type { AndroidManifest, ManifestUsesFeature } from './Manifest';

export const withUsesFeatures: ConfigPlugin = (config) => {
  if (!getUsesFeatures(config).length) {
    return config;
  }
  return withAndroidManifest(config, async (config) => {
    config.modResults = setUsesFeatures(config, config.modResults);
    return config;
  });
};

export function getUsesFeatures(
  config: Pick<ExpoConfig, 'android'>
): NonNullable<NonNullable<ExpoConfig['android']>['usesFeatures']> {
  return config.android?.usesFeatures ?? [];
}

export function setUsesFeatures(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
): AndroidManifest {
  const features = getUsesFeatures(config);
  if (!features.length) {
    return androidManifest;
  }

  const featuresByName = new Map(features.map((feature) => [feature.name, feature]));
  const usesFeatures: ManifestUsesFeature[] = [
    ...(androidManifest.manifest['uses-feature'] ?? []).filter(
      (feature) => !featuresByName.has(feature.$['android:name'])
    ),
    ...[...featuresByName.values()].map(({ name, required }) => ({
      $: {
        'android:name': name,
        ...(required === false && { 'android:required': 'false' as const }),
      },
    })),
  ];

  // The XML builder writes child elements in key order. Keep `<application>` last.
  const { application, ...manifest } = androidManifest.manifest;
  androidManifest.manifest = {
    ...manifest,
    'uses-feature': usesFeatures,
    ...(application && { application }),
  };
  return androidManifest;
}
