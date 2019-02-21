export declare type PackagerAsset = any;
declare enum AndroidAssetSuffix {
    LDPI = "ldpi",
    MDPI = "mdpi",
    HDPI = "hdpi",
    XHDPI = "xhdpi",
    XXHDPI = "xxhdpi",
    XXXHDPI = "xxxhdpi"
}
export declare function getAndroidAssetSuffix(scale: number): AndroidAssetSuffix;
export declare function getAndroidResourceFolderName(asset: PackagerAsset, scale: number): 'raw' | string;
export declare function getAndroidResourceIdentifier(asset: PackagerAsset): string;
export declare function getBasePath({ httpServerLocation }: PackagerAsset): string;
export {};
