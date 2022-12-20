import { PackagerAsset } from './ReactNativeCompatibleAssetsRegistry';
export type ResolvedAssetSource = {
    __packager_asset: boolean;
    width?: number;
    height?: number;
    uri: string;
    scale: number;
};
export default class AssetSourceResolver {
    serverUrl: string;
    jsbundleUrl?: string | null;
    asset: PackagerAsset;
    constructor(serverUrl: string | undefined | null, jsbundleUrl: string | undefined | null, asset: PackagerAsset);
    isLoadedFromServer(): boolean;
    isLoadedFromFileSystem(): boolean;
    defaultAsset(): ResolvedAssetSource;
    /**
     * @returns absolute remote URL for the hosted asset.
     */
    assetServerURL(): ResolvedAssetSource;
    fromSource(source: string): ResolvedAssetSource;
    static pickScale(scales: number[], deviceScale: number): number;
}
//# sourceMappingURL=AssetSourceResolver.web.d.ts.map