import { ExpoConfig } from '@expo/config-types';

import { createAndroidManifestPlugin } from '../plugins/android-plugins';
import { addWarningAndroid } from '../utils/warnings';
import { AndroidManifest, ManifestActivity } from './Manifest';

export type IntentFilterProps = {
  actions: string[];
  categories: string[];
  data: {
    scheme: string;
    host?: string;
  }[];
};

export const withScheme = createAndroidManifestPlugin(setScheme, 'withScheme');

export function getScheme(config: { scheme?: string | string[] }): string[] {
  if (Array.isArray(config.scheme)) {
    const validate = (value: any): value is string => typeof value === 'string';

    return config.scheme.filter<string>(validate);
  } else if (typeof config.scheme === 'string') {
    return [config.scheme];
  }
  return [];
}

// This plugin used to remove the unused schemes but this is unpredictable because other plugins could add schemes.
// The only way to reliably remove schemes from the project is to nuke the file and regenerate the code (`expo prebuild --clean`).
// Regardless, having extra schemes isn't a fatal issue and therefore a tolerable compromise is to just add new schemes that aren't currently present.
export function setScheme(
  config: Pick<ExpoConfig, 'scheme' | 'android'>,
  androidManifest: AndroidManifest
) {
  const schemes = [
    ...getScheme(config),
    // @ts-ignore: TODO: android.scheme is an unreleased -- harder to add to turtle v1.
    ...getScheme(config.android ?? {}),
  ];
  // Add the package name to the list of schemes for easier Google auth and parity with Turtle v1.
  if (config.android?.package) {
    schemes.push(config.android.package);
  }
  if (schemes.length === 0) {
    return androidManifest;
  }

  if (!ensureManifestHasValidIntentFilter(androidManifest)) {
    addWarningAndroid(
      'scheme',
      `Cannot add schemes because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\``,
      'https://expo.fyi/setup-android-uri-scheme'
    );
    return androidManifest;
  }

  // Get the current schemes and remove them from the list of schemes to add.
  const currentSchemes = getSchemesFromManifest(androidManifest);
  for (const uri of currentSchemes) {
    const index = schemes.indexOf(uri);
    if (index > -1) schemes.splice(index, 1);
  }

  // Now add all of the remaining schemes.
  for (const uri of schemes) {
    androidManifest = appendScheme(uri, androidManifest);
  }

  return androidManifest;
}

function isValidRedirectIntentFilter({ actions, categories }: IntentFilterProps): boolean {
  return (
    actions.includes('android.intent.action.VIEW') &&
    !categories.includes('android.intent.category.LAUNCHER')
  );
}

function propertiesFromIntentFilter(intentFilter: any): IntentFilterProps {
  const actions = intentFilter?.action?.map((data: any) => data?.$?.['android:name']) ?? [];
  const categories = intentFilter?.category?.map((data: any) => data?.$?.['android:name']) ?? [];
  const data =
    intentFilter?.data
      ?.filter((data: any) => data?.$?.['android:scheme'])
      ?.map((data: any) => ({
        scheme: data?.$?.['android:scheme'],
        host: data?.$?.['android:host'],
      })) ?? [];
  return {
    actions,
    categories,
    data,
  };
}

function getSingleTaskIntentFilters(androidManifest: AndroidManifest): any[] {
  if (!Array.isArray(androidManifest.manifest.application)) return [];

  let outputSchemes: any[] = [];
  for (const application of androidManifest.manifest.application) {
    const { activity } = application;
    // @ts-ignore
    const activities = Array.isArray(activity) ? activity : [activity];
    const singleTaskActivities = (activities as ManifestActivity[]).filter(
      activity => activity?.$?.['android:launchMode'] === 'singleTask'
    );
    for (const activity of singleTaskActivities) {
      const intentFilters = activity['intent-filter'];
      outputSchemes = outputSchemes.concat(intentFilters);
    }
  }
  return outputSchemes;
}

export function getSchemesFromManifest(
  androidManifest: AndroidManifest,
  requestedHost: string | null = null
): string[] {
  const outputSchemes: string[] = [];

  const singleTaskIntentFilters = getSingleTaskIntentFilters(androidManifest);
  for (const intentFilter of singleTaskIntentFilters) {
    const properties = propertiesFromIntentFilter(intentFilter);
    if (isValidRedirectIntentFilter(properties) && properties.data) {
      for (const { scheme, host } of properties.data) {
        if (requestedHost === null || !host || host === requestedHost) {
          outputSchemes.push(scheme);
        }
      }
    }
  }

  return outputSchemes;
}

export function ensureManifestHasValidIntentFilter(androidManifest: AndroidManifest): boolean {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return false;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          // Parse valid intent filters...
          const properties = propertiesFromIntentFilter(intentFilter);
          if (isValidRedirectIntentFilter(properties)) {
            return true;
          }
        }
        if (!activity['intent-filter']) {
          activity['intent-filter'] = [];
        }

        activity['intent-filter'].push({
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          category: [
            { $: { 'android:name': 'android.intent.category.DEFAULT' } },
            { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
          ],
        });
        return true;
      }
    }
  }
  return false;
}

export function hasScheme(scheme: string, androidManifest: AndroidManifest): boolean {
  const schemes = getSchemesFromManifest(androidManifest);
  return schemes.includes(scheme);
}

export function appendScheme(scheme: string, androidManifest: AndroidManifest): AndroidManifest {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return androidManifest;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          const properties = propertiesFromIntentFilter(intentFilter);
          if (isValidRedirectIntentFilter(properties)) {
            if (!intentFilter.data) intentFilter.data = [];
            intentFilter.data.push({
              $: { 'android:scheme': scheme },
            });
          }
        }
        break;
      }
    }
  }
  return androidManifest;
}

export function removeScheme(scheme: string, androidManifest: AndroidManifest): AndroidManifest {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return androidManifest;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          // Parse valid intent filters...
          const properties = propertiesFromIntentFilter(intentFilter);
          if (isValidRedirectIntentFilter(properties)) {
            for (const dataKey in intentFilter?.data || []) {
              const data = intentFilter.data?.[dataKey];
              if (data?.$?.['android:scheme'] === scheme) {
                delete intentFilter.data?.[dataKey];
              }
            }
          }
        }
        break;
      }
    }
  }

  return androidManifest;
}
