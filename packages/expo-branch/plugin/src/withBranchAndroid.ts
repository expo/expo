import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const META_BRANCH_KEY = 'io.branch.sdk.BranchKey';

export const withBranchAndroid: ConfigPlugin<{ apiKey?: string }> = (config, { apiKey }) => {
  const key = apiKey ?? getBranchApiKey(config);

  // Apply the property to the static location in the Expo config
  // for any Expo Go tooling that might expect it to be in a certain location.
  if (key != null) {
    if (!config.android) config.android = {};
    if (!config.android.config) config.android.config = {};
    if (!config.android.config.branch) config.android.config.branch = {};
    config.android.config.branch.apiKey = key;
  }

  return withAndroidManifest(config, config => {
    config.modResults = setBranchApiKey(key, config.modResults);
    return config;
  });
};

export function getBranchApiKey(config: ExpoConfig) {
  return config.android?.config?.branch?.apiKey ?? null;
}

export function setBranchApiKey(
  apiKey: string | null,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
) {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  if (apiKey) {
    // If the item exists, add it back
    addMetaDataItemToMainApplication(mainApplication, META_BRANCH_KEY, apiKey);
  } else {
    // Remove any existing item
    removeMetaDataItemFromMainApplication(mainApplication, META_BRANCH_KEY);
  }
  return androidManifest;
}
