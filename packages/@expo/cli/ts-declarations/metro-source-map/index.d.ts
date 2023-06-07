declare module 'metro-source-map' {
  export * from 'metro-source-map/src/source-map';
  import { MixedSourceMap } from 'metro-source-map/src/source-map';

  // `composeSourceMaps` is not exported from metro.
  // This ts-declarations is used and shared for `@expo/dev-server`.
  export function composeSourceMaps(maps: Readonly<MixedSourceMap[]>): MixedSourceMap;
}
