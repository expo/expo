import computeMd5 from 'blueimp-md5';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { getManifestBaseUrl } from './AssetUris';
export const IS_MANAGED_ENV = !!Constants.appOwnership;
export function getManifest() {
    return Constants.manifest || {};
}
// Compute manifest base URL if available
export const manifestBaseUrl = Constants.experienceUrl
    ? getManifestBaseUrl(Constants.experienceUrl)
    : null;
export async function downloadAsync(uri, hash, type, name) {
    if (IS_MANAGED_ENV) {
        return _downloadAsyncManagedEnv(uri, hash, type, name);
    }
    return _downloadAsyncUnmanagedEnv(uri, hash, type);
}
async function _downloadAsyncManagedEnv(uri, hash, type, name) {
    const cacheFileId = hash || computeMd5(uri);
    const localUri = `${FileSystem.cacheDirectory}ExponentAsset-${cacheFileId}.${type}`;
    let { exists, md5 } = await FileSystem.getInfoAsync(localUri, {
        md5: true,
    });
    if (!exists || (hash !== null && md5 !== hash)) {
        ({ md5 } = await FileSystem.downloadAsync(uri, localUri, {
            md5: true,
        }));
        if (hash !== null && md5 !== hash) {
            throw new Error(`Downloaded file for asset '${name}.${type}' ` +
                `Located at ${uri} ` +
                `failed MD5 integrity check`);
        }
    }
    return localUri;
}
async function _downloadAsyncUnmanagedEnv(uri, hash, type) {
    // Bail out if it's already at a file URL because it's already available locally
    if (uri.startsWith('file://')) {
        return uri;
    }
    const cacheFileId = hash || computeMd5(uri);
    const localUri = `${FileSystem.cacheDirectory}ExponentAsset-${cacheFileId}.${type}`;
    // We don't check the FileSystem for an existing version of the asset and we
    // also don't perform an integrity check!
    await FileSystem.downloadAsync(uri, localUri);
    return localUri;
}
//# sourceMappingURL=PlatformUtils.js.map