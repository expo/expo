declare type PackagerAsset = any;
export declare type ResolvedAssetSource = {
    __packager_asset: boolean;
    width?: number;
    height?: number;
    uri: string;
    scale: number;
};
export default class AssetSourceResolver {
    serverUrl?: string | null;
    jsbundleUrl?: string | null;
    asset: PackagerAsset;
    constructor(serverUrl: string | undefined | null, jsbundleUrl: string | undefined | null, asset: PackagerAsset);
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
export {};
