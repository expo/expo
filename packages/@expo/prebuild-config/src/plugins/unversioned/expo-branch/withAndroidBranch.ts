import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const META_BRANCH_KEY = 'io.branch.sdk.BranchKey';

export const withAndroidBranch: ConfigPlugin = config => {
  return withAndroidManifest(config, config => {
    config.modResults = setBranchApiKey(config, config.modResults);
    return config;
  });
};

export function getBranchApiKey(config: ExpoConfig) {
  return config.android?.config?.branch?.apiKey ?? null;
}

export function setBranchApiKey(
  config: ExpoConfig,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
) {
  const apiKey = getBranchApiKey(config);

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
