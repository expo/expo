declare module 'react-native/Libraries/Image/AssetRegistry' {
  export type PackagerAsset = any;
  export function registerAsset(asset: PackagerAsset): number;
  export function getAssetByID(assetID: number): PackagerAsset | undefined;
}
