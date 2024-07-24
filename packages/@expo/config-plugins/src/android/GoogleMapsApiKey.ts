import { ExpoConfig } from '@expo/config-types';

import {
  addMetaDataItemToMainApplication,
  addUsesLibraryItemToMainApplication,
  AndroidManifest,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
  removeUsesLibraryItemFromMainApplication,
} from './Manifest';
import { createAndroidManifestPlugin } from '../plugins/android-plugins';

const META_API_KEY = 'com.google.android.geo.API_KEY';
const LIB_HTTP = 'org.apache.http.legacy';

export const withGoogleMapsApiKey = createAndroidManifestPlugin(
  setGoogleMapsApiKey,
  'withGoogleMapsApiKey'
);

export function getGoogleMapsApiKey(config: Pick<ExpoConfig, 'android'>) {
  return config.android?.config?.googleMaps?.apiKey ?? null;
}

export function setGoogleMapsApiKey(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
) {
  const apiKey = getGoogleMapsApiKey(config);
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  if (apiKey) {
    // If the item exists, add it back
    addMetaDataItemToMainApplication(mainApplication, META_API_KEY, apiKey);
    addUsesLibraryItemToMainApplication(mainApplication, {
      name: LIB_HTTP,
      required: false,
    });
  } else {
    // Remove any existing item
    removeMetaDataItemFromMainApplication(mainApplication, META_API_KEY);
    removeUsesLibraryItemFromMainApplication(mainApplication, LIB_HTTP);
  }

  return androidManifest;
}
