import {
  AndroidConfig,
  AndroidManifest,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import {
  ManifestActivity,
  ManifestIntentFilter,
} from '@expo/config-plugins/build/android/Manifest';
import { ExpoConfig } from 'expo/config';

import getDefaultScheme from './getDefaultScheme';

export const withGeneratedAndroidScheme: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = setGeneratedAndroidScheme(config, config.modResults);
    config.modResults = removeExpoSchemaFromVerifiedIntentFilters(config, config.modResults);
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

/**
 * Remove the custom Expo dev client scheme from intent filters, which are set to `autoVerify=true`.
 * The custom scheme `<data android:scheme="exp+<slug>"/>` seems to block verification for these intent filters.
 * This plugin makes sure there is no scheme in the autoVerify intent filters, that starts with `exp+`.
 
 * Iterate over all `autoVerify=true` intent filters, and pull out schemes matching with `exp+<slug>`.
 *
 * @param {AndroidManifest} androidManifest
 */
export function removeExpoSchemaFromVerifiedIntentFilters(
  config: Pick<ExpoConfig, 'scheme' | 'slug'>,
  androidManifest: AndroidManifest
) {
  // Generate a cross-platform scheme used to launch the dev client.
  const defaultScheme = getDefaultScheme(config);
  // see: https://github.com/expo/expo-cli/blob/f1624c75b52cc1c4f99354ec4021494e0eff74aa/packages/config-plugins/src/android/Scheme.ts#L164-L179
  for (const application of androidManifest.manifest.application || []) {
    for (const activity of application.activity || []) {
      if (activityHasSingleTaskLaunchMode(activity)) {
        for (const intentFilter of activity['intent-filter'] || []) {
          if (intentFilterHasAutoVerification(intentFilter) && intentFilter?.data) {
            intentFilter.data = intentFilterRemoveSchemeFromData(
              intentFilter,
              (scheme: string) => scheme === defaultScheme
            );
          }
        }
        break;
      }
    }
  }

  return androidManifest;
}

/**
 * Determine if the activity should contain the intent filters to clean.
 *
 * @see https://github.com/expo/expo-cli/blob/f1624c75b52cc1c4f99354ec4021494e0eff74aa/packages/config-plugins/src/android/Scheme.ts#L166
 */
function activityHasSingleTaskLaunchMode(activity: ManifestActivity) {
  return activity?.$?.['android:launchMode'] === 'singleTask';
}

/**
 * Determine if the intent filter has `autoVerify=true`.
 */
function intentFilterHasAutoVerification(intentFilter: ManifestIntentFilter) {
  return intentFilter?.$?.['android:autoVerify'] === 'true';
}

/**
 * Remove schemes from the intent filter that matches the function.
 */
function intentFilterRemoveSchemeFromData(intentFilter: ManifestIntentFilter, schemeMatcher: any) {
  return intentFilter?.data?.filter((entry) => !schemeMatcher(entry?.$['android:scheme'] || ''));
}
