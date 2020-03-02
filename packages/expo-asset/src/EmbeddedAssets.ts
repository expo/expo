import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Updates from 'expo-updates';

// Fast lookup check if assets are available in the local bundle
const bundledAssets = new Set(FileSystem.bundledAssets || []);
const localAssets = Updates.localAssets;

/**
 * Returns the local URI of an embedded asset from its hash and type, or null if the asset is not
 * included in the app bundle.
 */
export function getEmbeddedAssetUri(hash: string, type: string | null): string | null {
  if (__DEV__) {
    return null;
  }
  const localAssetsKey = `${hash}.${type ?? ''}`;
  if (!localAssets.hasOwnProperty(localAssetsKey)) {
    // check legacy location in case we're in Expo client/managed workflow
    // TODO(eric): remove this once bundledAssets is no longer exported from FileSystem
    const assetName = `asset_${hash}${type ? `.${type}` : ''}`;
    if (Constants.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
      return null;
    }
    return `${FileSystem.bundleDirectory}${assetName}`;
  }
  return localAssets[localAssetsKey];
}
