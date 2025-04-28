import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver';
export declare function setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): void;
type ResolveAssetSource = {
    (source: any): ResolvedAssetSource | null;
    setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): ResolvedAssetSource;
};
declare const _default: ResolveAssetSource;
export default _default;
export declare const pickScale: typeof AssetSourceResolver.pickScale;
//# sourceMappingURL=resolveAssetSource.d.ts.map