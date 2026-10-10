import 'react-native';

declare module 'react-native' {
  // NOTE(@kitten): Custom override supported in Expo only
  interface VirtualAssetModule {
    uri: string;
    width: number;
    height: number;
  }

  interface AssetRegistry {
    getAssetByID(input: number | VirtualAssetModule): PackagerAsset | undefined;
  }
}
