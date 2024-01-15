import computeMd5 from 'blueimp-md5';
import Constants, { AppOwnership } from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { getManifestBaseUrl } from './AssetUris';
const ExpoUpdates = requireOptionalNativeModule('ExpoUpdates');
const isRunningInExpoGo = Constants.appOwnership === AppOwnership.Expo;
// expo-updates (and Expo Go expo-updates override) manages assets from updates and exposes
// the ExpoUpdates.localAssets constant containing information about the assets.
const expoUpdatesIsInstalledAndEnabled = !!ExpoUpdates?.isEnabled;
const expoUpdatesIsUsingEmbeddedAssets = ExpoUpdates?.isUsingEmbeddedAssets;
// if expo-updates is installed but we're running directly from the embedded bundle, we don't want
// to override the AssetSourceResolver.
const shouldUseUpdatesAssetResolution = expoUpdatesIsInstalledAndEnabled && !expoUpdatesIsUsingEmbeddedAssets;
// Expo Go always uses the updates module for asset resolution (local assets) since it
// overrides the expo-updates module.
export const IS_ENV_WITH_LOCAL_ASSETS = isRunningInExpoGo || shouldUseUpdatesAssetResolution;
// Get the localAssets property from the ExpoUpdates native module so that we do
// not need to include expo-updates as a dependency of expo-asset
export function getLocalAssets() {
    return ExpoUpdates?.localAssets ?? {};
}
export function getManifest2() {
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
export async function downloadAsync(url, md5Hash, type) {
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
//# sourceMappingURL=PlatformUtils.js.map