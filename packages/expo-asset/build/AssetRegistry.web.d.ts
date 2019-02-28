export declare function registerAsset(asset: PackagerAsset): number;
export declare function getAssetByID(assetId: number): PackagerAsset;
export declare type PackagerAsset = {
    __packager_asset: boolean;
    fileSystemLocation: string;
    httpServerLocation: string;
    width?: number;
    height?: number;
    scales: number[];
    hash: string;
    name: string;
    type: string;
};
