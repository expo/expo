import type { registerAsset, getAssetByID } from '@react-native/assets/registry';
export type { PackagerAsset } from '@react-native/assets/registry';
declare let registry: any | null;
declare const registerAssetImport: typeof registerAsset;
declare const getAssetByIDImport: typeof getAssetByID;
export { registerAssetImport as registerAsset };
export { getAssetByIDImport as getAssetByID };
export default registry;
//# sourceMappingURL=ReactNativeCompatibleAssetsRegistry.d.ts.map