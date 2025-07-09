import { getLocalAssets } from './PlatformUtils';

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
    default:
      return null;
  }
}
