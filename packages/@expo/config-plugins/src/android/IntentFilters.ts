import { Android, AndroidIntentFiltersData, ExpoConfig } from '@expo/config-types';

import { createAndroidManifestPlugin } from '../plugins/android-plugins';
import { AndroidManifest, getMainActivityOrThrow, ManifestIntentFilter } from './Manifest';

type AndroidIntentFilters = NonNullable<Android['intentFilters']>;

const GENERATED_TAG = 'data-generated';

export const withAndroidIntentFilters = createAndroidManifestPlugin(
  setAndroidIntentFilters,
  'withAndroidIntentFilters'
);

export function getIntentFilters(config: Pick<ExpoConfig, 'android'>): AndroidIntentFilters {
  return config.android?.intentFilters ?? [];
}

export function setAndroidIntentFilters(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
): AndroidManifest {
  // Always ensure old tags are removed.
  const mainActivity = getMainActivityOrThrow(androidManifest);
  // Remove all generated tags from previous runs...
  if (mainActivity['intent-filter']?.length) {
    mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
      value => value.$?.[GENERATED_TAG] !== 'true'
    );
  }

  const intentFilters = getIntentFilters(config);
  if (!intentFilters.length) {
    return androidManifest;
  }

  mainActivity['intent-filter'] = mainActivity['intent-filter']?.concat(
    renderIntentFilters(intentFilters)
  );

  return androidManifest;
}

export default function renderIntentFilters(
  intentFilters: AndroidIntentFilters
): ManifestIntentFilter[] {
  return intentFilters.map(intentFilter => {
    // <intent-filter>
    return {
      $: {
        'android:autoVerify': intentFilter.autoVerify ? 'true' : undefined,
        // Add a custom "generated" tag that we can query later to remove.
        [GENERATED_TAG]: 'true',
      },
      action: [
        // <action android:name="android.intent.action.VIEW"/>
        {
          $: {
            'android:name': `android.intent.action.${intentFilter.action}`,
          },
        },
      ],
      data: renderIntentFilterData(intentFilter.data),
      category: renderIntentFilterCategory(intentFilter.category),
    };
  });
}

/** Like `<data android:scheme="exp"/>` */
function renderIntentFilterData(data?: AndroidIntentFiltersData | AndroidIntentFiltersData[]) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map(datum => ({
    $: Object.entries(datum ?? {}).reduce(
      (prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }),
      {}
    ),
  }));
}

/** Like `<category android:name="android.intent.category.DEFAULT"/>` */
function renderIntentFilterCategory(category?: string | string[]) {
  return (Array.isArray(category) ? category : [category]).filter(Boolean).map(cat => ({
    $: {
      'android:name': `android.intent.category.${cat}`,
    },
  }));
}
