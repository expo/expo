// The `react-native/asset-registry` build entry point ships untyped. Its exports are the
// `AssetRegistry` API from `react-native`, which Expo's Metro resolver serves on every platform.
declare module 'react-native/asset-registry' {
  export type AssetDestPathResolver = 'android' | 'generic';

  export type PackagerAsset = Readonly<{
    fileSystemLocation: string;
    httpServerLocation: string;
    width: number | undefined;
    height: number | undefined;
    scales: number[];
    hash: string;
    name: string;
    type: string;
    resolver?: AssetDestPathResolver | undefined;
  }>;

  export function registerAsset(asset: PackagerAsset): number;

  // NOTE(@kitten): Custom override supported in Expo only
  interface VirtualAssetModule {
    uri: string;
    width: number;
    height: number;
  }

  export function getAssetByID(input: number | VirtualAssetModule): PackagerAsset | undefined;
}
