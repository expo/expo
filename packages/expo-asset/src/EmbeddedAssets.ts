import Constants from 'expo-constants';
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
export function getEmbeddedAssetUri(hash: string, type: string | null): string | null {
  const localAssetsKey = `${hash}.${type ?? ''}`;
  if (!localAssets.hasOwnProperty(localAssetsKey) && !__DEV__) {
    // check legacy location in case we're in Expo client/managed workflow
    // TODO(eric): remove this once bundledAssets is no longer exported from FileSystem
    const assetName = `asset_${hash}${type ? `.${type}` : ''}`;
    if (Constants.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
      return null;
    }
    return `${FileSystem.bundleDirectory}${assetName}`;
  }
  return localAssets[localAssetsKey] ?? null;
}
