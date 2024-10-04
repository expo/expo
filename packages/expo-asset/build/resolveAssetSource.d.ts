import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver';
export declare function setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): void;
/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
export default function resolveAssetSource(source: any): ResolvedAssetSource | null;
export declare const pickScale: typeof AssetSourceResolver.pickScale;
//# sourceMappingURL=resolveAssetSource.d.ts.map