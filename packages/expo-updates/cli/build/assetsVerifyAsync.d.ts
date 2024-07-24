import { BuildManifest, ExportedMetadata, FullAssetDump, FullAssetDumpEntry, MissingAsset, Platform } from './assetsVerifyTypes';
/**
 * Finds any assets that will be missing from an app given a build and an exported update bundle.
 *
 * @param buildManifestPath Path to the `app.manifest` file created by expo-updates in an Expo application build (either ios or android)
 * @param exportMetadataPath Path to the `metadata.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param assetMapPath Path to the `assetmap.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param projectRoot The project root path
 * @returns An array containing any assets that are found in the Metro asset dump, but not included in either app.manifest or the exported bundle
 */
export declare function getMissingAssetsAsync(buildManifestPath: string, exportMetadataPath: string, assetMapPath: string, platform: Platform): Promise<MissingAsset[]>;
/**
 * Reads and returns the embedded manifest (app.manifest) for a build.
 *
 * @param buildManifestPath Path to the build folder
 * @param platform Either 'android' or 'ios'
 * @param projectRoot The project root path
 * @returns the JSON structure of the manifest
 */
export declare function getBuildManifestAsync(buildManifestPath: string): Promise<BuildManifest>;
/**
 * Extracts the set of asset hashes from a build manifest.
 *
 * @param buildManifest The build manifest
 * @returns The set of asset hashes contained in the build manifest
 */
export declare function getBuildManifestHashSet(buildManifest: BuildManifest): Set<string>;
/**
 * Reads and extracts the asset dump for an exported bundle.
 *
 * @param assetMapPath The path to the exported assetmap.json.
 * @returns The asset dump as an object.
 */
export declare function getFullAssetDumpAsync(assetMapPath: string): Promise<FullAssetDump>;
/**
 * Extracts the set of asset hashes from an asset dump.
 *
 * @param assetDump
 * @returns The set of asset hashes in the asset dump, and a map of hash to asset
 */
export declare function getFullAssetDumpHashSet(assetDump: FullAssetDump): {
    fullAssetHashSet: Set<string>;
    fullAssetHashMap: Map<string, FullAssetDumpEntry>;
};
/**
 * Reads and extracts the metadata.json from an exported bundle.
 *
 * @param exportedMetadataPath Path to the exported metadata.json.
 * @returns The metadata of the bundle.
 */
export declare function getExportedMetadataAsync(exportedMetadataPath: string): Promise<ExportedMetadata>;
/**
 * Extracts the set of asset hashes from an exported bundle's metadata for a given platform.
 *
 * @param metadata The metadata from the exported bundle
 * @param platform Either 'android' or 'ios'
 * @returns the set of asset hashes
 */
export declare function getExportedMetadataHashSet(metadata: ExportedMetadata, platform: Platform): Set<string>;
