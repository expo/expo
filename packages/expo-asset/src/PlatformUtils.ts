import computeMd5 from 'blueimp-md5';
import Constants, { AppOwnership } from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { getManifestBaseUrl } from './AssetUris';

const ExpoUpdates = requireOptionalNativeModule('ExpoUpdates');

export const IS_EXPO_GO = Constants.appOwnership === AppOwnership.Expo;

// In the future (SDK38+) expo-updates is likely to be used in managed apps, so we decide
// that you are in a bare app with updates if you're not in a managed app and you have
// local assets available.
export const IS_BARE_ENV_WITH_UPDATES =
  !IS_EXPO_GO &&
  !!ExpoUpdates?.isEnabled &&
  // if expo-updates is installed but we're running directly from the embedded bundle, we don't want
  // to override the AssetSourceResolver
  !ExpoUpdates?.isUsingEmbeddedAssets;

export const IS_ENV_WITH_UPDATES_ENABLED = IS_EXPO_GO || IS_BARE_ENV_WITH_UPDATES;

// If it's not managed or bare w/ updates, then it must be bare w/o updates!
export const IS_BARE_ENV_WITHOUT_UPDATES = !IS_EXPO_GO && !IS_BARE_ENV_WITH_UPDATES;

// Get the localAssets property from the ExpoUpdates native module so that we do
// not need to include expo-updates as a dependency of expo-asset
export function getLocalAssets() {
  return ExpoUpdates?.localAssets ?? {};
}

export function getManifest(): { [key: string]: any } {
  return Constants.__unsafeNoWarnManifest ?? {};
}

export function getManifest2(): typeof Constants.__unsafeNoWarnManifest2 | undefined {
  return Constants.__unsafeNoWarnManifest2;
}

// Compute manifest base URL if available
export const manifestBaseUrl = Constants.experienceUrl
  ? getManifestBaseUrl(Constants.experienceUrl)
  : null;

/**
 * Downloads the asset from the given URL to a local cache and returns the local URL of the cached
 * file.
 *
 * If there is already a locally cached file and its MD5 hash matches the given `md5Hash` parameter,
 * if present, the remote asset is not downloaded. The `hash` property is included in Metro's asset
 * metadata objects when this module's `hashAssetFiles` plugin is used, which is the typical way the
 * `md5Hash` parameter of this function is provided.
 */
export async function downloadAsync(
  url: string,
  md5Hash: string | null,
  type: string
): Promise<string> {
  if (url.startsWith('file://')) {
    return url;
  }

  const cacheFileId = md5Hash ?? computeMd5(url);
  const localUri = `${FileSystem.cacheDirectory}ExponentAsset-${cacheFileId}.${type}`;
  const fileInfo = await FileSystem.getInfoAsync(localUri, { md5: md5Hash !== null });

  if (!fileInfo.exists || (md5Hash !== null && fileInfo.md5 !== md5Hash)) {
    await FileSystem.downloadAsync(url, localUri);
  }

  return localUri;
}
