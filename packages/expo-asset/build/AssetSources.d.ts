import { PackagerAsset } from 'react-native/Libraries/Image/AssetRegistry';
export type AssetMetadata = Pick<PackagerAsset, 'httpServerLocation' | 'name' | 'hash' | 'type' | 'scales' | 'width' | 'height'> & {
    uri?: string;
    fileHashes?: string[];
    fileUris?: string[];
};
export type AssetSource = {
    uri: string;
    hash: string;
};
/**
 * Selects the best file for the given asset (ex: choosing the best scale for images) and returns
 * a { uri, hash } pair for the specific asset file.
 *
 * If the asset isn't an image with multiple scales, the first file is selected.
 */
export declare function selectAssetSource(meta: AssetMetadata): AssetSource;
/**
 * Resolves the given URI to an absolute URI. If the given URI is already an absolute URI, it is
 * simply returned. Otherwise, if it is a relative URI, it is resolved relative to the manifest's
 * base URI.
 */
export declare function resolveUri(uri: string): string;
//# sourceMappingURL=AssetSources.d.ts.map