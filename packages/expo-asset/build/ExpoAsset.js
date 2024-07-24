import { requireNativeModule } from 'expo-modules-core';
const AssetModule = requireNativeModule('ExpoAsset');
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
    return AssetModule.downloadAsync(url, md5Hash, type);
}
//# sourceMappingURL=ExpoAsset.js.map