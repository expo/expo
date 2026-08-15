import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidManifest,
  AndroidConfig,
  ExportedConfigWithProps,
} from '@expo/config-plugins';
import { AndroidIntentFiltersData } from '@expo/config-types';

import { SingleIntentFilter, MultiIntentFilter, IntentFilter } from '../sharingPlugin.types';

const SHARING_GENERATED_TAG = 'expo-sharing-intent-filters';
type WithAndroidIntentFiltersOptions = {
  intentFilters: IntentFilter[];
};

export const withAndroidIntentFilters: ConfigPlugin<WithAndroidIntentFiltersOptions> = (
  config,
  { intentFilters }
) => {
  return withAndroidManifest(config, (config) => {
    setAndroidIntentFilters(config, intentFilters);
    return config;
  });
};

export function setAndroidIntentFilters(
  config: ExportedConfigWithProps<AndroidManifest>,
  intentFilters: IntentFilter[]
): ExportedConfigWithProps<AndroidManifest> {
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
  // Remove all generated tags from previous runs...
  if (mainActivity['intent-filter']?.length) {
    mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
      // @ts-ignore
      (value) => value.$?.[SHARING_GENERATED_TAG] !== 'true'
    );
  }

  if (!intentFilters.length) {
    return config;
  }

  mainActivity['intent-filter'] = mainActivity['intent-filter']?.concat(
    renderIntentFilters(intentFilters)
  );

  return config;
}

export default function renderIntentFilters(
  intentFilters: (SingleIntentFilter | MultiIntentFilter)[]
): AndroidConfig.Manifest.ManifestIntentFilter[] {
  return intentFilters.map((intentFilter) => ({
    $: {
      'android:autoVerify': 'false',
      // Add a custom "generated" tag that we can query later to remove.
      [SHARING_GENERATED_TAG]: 'true',
    },
    action: [
      // <action android:name="android.intent.action.SEND"/> or SEND_MULTIPLE
      {
        $: {
          'android:name': intentFilter.action,
        },
      },
    ],
    data: renderIntentFilterData(intentFilter.data),
    category: [
      {
        $: {
          'android:name': intentFilter.category,
        },
      },
    ],
  }));
}

/** Like `<data android:scheme="exp"/>` */
function renderIntentFilterData(data?: AndroidIntentFiltersData | AndroidIntentFiltersData[]) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
    $: Object.entries(datum ?? {}).reduce(
      (prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }),
      {}
    ),
  }));
}
