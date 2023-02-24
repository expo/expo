// Remove this when we drop SDK 47
import type { registerAsset, getAssetByID } from '@react-native/assets/registry';
export type { PackagerAsset } from '@react-native/assets/registry';

let registry: any | null = null;
try {
  registry = require('@react-native/assets-registry/registry');
} catch {}
if (!registry) {
  try {
    registry = require('@react-native/assets/registry');
  } catch {}
}
if (!registry) {
  throw new Error(
    'Cannot import `@react-native/assets-registry` or `@react-native/assets` package'
  );
}

const registerAssetImport = registry.registerAsset as typeof registerAsset;
const getAssetByIDImport = registry.getAssetByID as typeof getAssetByID;
export { registerAssetImport as registerAsset };
export { getAssetByIDImport as getAssetByID };

export default registry;
