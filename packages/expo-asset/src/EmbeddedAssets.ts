import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

// Fast lookup check if assets are available in the local bundle
const bundledAssets = new Set(FileSystem.bundledAssets || []);

/**
 * Returns the local URI of an embedded asset from its hash and type, or null if the asset is not
 * included in the app bundle.
 */
export function getEmbeddedAssetUri(hash: string, type: string | null): string | null {
  const assetName = `asset_${hash}${type ? `.${type}` : ''}`;
  if (__DEV__ || Constants.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
    return null;
  }
  return `${FileSystem.bundleDirectory}${assetName}`;
}
