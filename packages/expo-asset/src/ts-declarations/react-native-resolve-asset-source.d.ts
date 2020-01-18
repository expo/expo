declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import AssetSourceResolver, {
    ResolvedAssetSource,
  } from 'react-native/Libraries/Image/AssetSourceResolver';

  export default function resolveAssetSource(source: any): ResolvedAssetSource;

  export function setCustomSourceTransformer(
    transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource
  ): void;
}
