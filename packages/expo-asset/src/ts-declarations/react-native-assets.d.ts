declare module 'react-native/Libraries/Image/AssetSourceResolver' {
  import { PackagerAsset } from '@react-native/assets/registry';

  export type ResolvedAssetSource = {
    __packager_asset: boolean;
    width: number | null;
    height: number | null;
    uri: string;
    scale: number;
  };

  export default class AssetSourceResolver {
    serverUrl: string | null;
    jsbundleUrl: string | null;
    asset: PackagerAsset & { fileHashes?: string[] };

    constructor(serverUrl: string | null, jsbundleUrl: string | null, asset: PackagerAsset);

    isLoadedFromServer(): boolean;
    isLoadedFromFileSystem(): boolean;
    defaultAsset(): ResolvedAssetSource;
    assetServerURL(): ResolvedAssetSource;
    scaledAssetPath(): ResolvedAssetSource;
    scaledAssetURLNearBundle(): ResolvedAssetSource;
    resourceIdentifierWithoutScale(): ResolvedAssetSource;
    drawableFolderInBundle(): ResolvedAssetSource;
    fromSource(source: string): ResolvedAssetSource;

    static pickScale(scales: number[], deviceScale: number): number;
  }
}

declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import AssetSourceResolver, {
    ResolvedAssetSource,
  } from 'react-native/Libraries/Image/AssetSourceResolver';

  export default function resolveAssetSource(source: any): ResolvedAssetSource;

  export function setCustomSourceTransformer(
    transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource
  ): void;
}
