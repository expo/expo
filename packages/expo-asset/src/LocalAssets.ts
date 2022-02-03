import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

import { getLocalAssets } from './PlatformUtils';

// Fast lookup check if assets are available in the local bundle in managed apps
const bundledAssets = new Set(FileSystem.bundledAssets || []);

// localAssets are provided by the expo-updates module
const localAssets = getLocalAssets();

/**
 * Returns the URI of a local asset from its hash, or null if the asset is not available locally
 */
export function getLocalAssetUri(hash: string, type: string | null): string | null {
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
      if (Constants.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
        return null;
      }
      return `${FileSystem.bundleDirectory}${assetName}`;
    }
    default:
      return null;
  }
}
