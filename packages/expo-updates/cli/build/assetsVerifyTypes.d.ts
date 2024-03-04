export declare const validPlatforms: string[];
export type Platform = (typeof validPlatforms)[number];
export declare const isValidPlatform: (p: any) => boolean;
export interface ValidatedOptions {
    exportedManifestPath: string;
    buildManifestPath: string;
    assetMapPath: string;
    platform: Platform;
}
export type FullAssetDumpEntry = {
    files: string[];
    hash: string;
    name: string;
    type: string;
    fileHashes: string[];
};
export type FullAssetDump = Map<string, FullAssetDumpEntry>;
export type BuildManifestAsset = {
    name: string;
    type: string;
    packagerHash: string;
};
export type BuildManifest = {
    assets: BuildManifestAsset[];
} & {
    [key: string]: any;
};
export type ExportedMetadataAsset = {
    path: string;
    ext: string;
};
export type FileMetadata = {
    bundle: string;
    assets: ExportedMetadataAsset[];
};
export type ExportedMetadata = {
    fileMetadata: {
        ios?: FileMetadata;
        android?: FileMetadata;
    };
};
export type MissingAsset = {
    hash: string;
    path: string;
};
