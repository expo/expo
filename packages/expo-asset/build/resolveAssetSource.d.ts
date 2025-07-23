import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver';
export declare function setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): void;
interface resolveAssetSource {
    (source: any): ResolvedAssetSource | null;
    setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): ResolvedAssetSource;
}
/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
declare function resolveAssetSource(source: any): ResolvedAssetSource | null;
declare const _default: resolveAssetSource;
export default _default;
export declare const pickScale: typeof AssetSourceResolver.pickScale;
//# sourceMappingURL=resolveAssetSource.d.ts.map