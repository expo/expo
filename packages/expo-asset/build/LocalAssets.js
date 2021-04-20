import LocalAssets from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { getLocalAssets } from './PlatformUtils';
// Fast lookup check if assets are available in the local bundle in managed apps
const bundledAssets = new Set(FileSystem.bundledAssets || []);
// localAssets are provided by the expo-updates module
const localAssets = getLocalAssets();
/**
 * Returns the local URI of an embedded asset from its hash and type, or null if the asset is not
 * included in the app bundle.
 */
export function getLocalAssetUri(hash, type) {
    const localAssetsKey = hash;
    const legacyLocalAssetsKey = `${hash}.${type ?? ''}`;
    switch (true) {
        case localAssetsKey in localAssets: {
            return localAssets[localAssetsKey];
        }
        case legacyLocalAssetsKey in localAssets: {
            // legacy updates store assets with an extension
            return localAssets[legacyLocalAssetsKey];
        }
        case !__DEV__: {
            // check legacy location in case we're in Expo client/managed workflow
            // TODO(eric): remove this once bundledAssets is no longer exported from FileSystem
            const assetName = `asset_${hash}${type ? `.${type}` : ''}`;
            if (LocalAssets.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
                return null;
            }
            return `${FileSystem.bundleDirectory}${assetName}`;
        }
        default:
            return null;
    }
}
//# sourceMappingURL=LocalAssets.js.map