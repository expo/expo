import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver.web';
export declare function setCustomSourceTransformer(transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource): void;
/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
export default function resolveAssetSource(source: any): ResolvedAssetSource | undefined;
export declare const pickScale: typeof AssetSourceResolver.pickScale;
//# sourceMappingURL=resolveAssetSource.web.d.ts.map