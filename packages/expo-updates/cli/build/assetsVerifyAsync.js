"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportedMetadataHashSet = exports.getExportedMetadataAsync = exports.getFullAssetDumpHashSet = exports.getFullAssetDumpAsync = exports.getBuildManifestHashSet = exports.getBuildManifestAsync = exports.getMissingAssetsAsync = void 0;
const fs_1 = require("fs");
const errors_1 = require("./utils/errors");
const debug = require('debug')('expo-updates:assets:verify');
/**
 * Finds any assets that will be missing from an app given a build and an exported update bundle.
 *
 * @param buildManifestPath Path to the `app.manifest` file created by expo-updates in an Expo application build (either ios or android)
 * @param exportMetadataPath Path to the `metadata.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param assetMapPath Path to the `assetmap.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param projectRoot The project root path
 * @returns An array containing any assets that are found in the Metro asset dump, but not included in either app.manifest or the exported bundle
 */
async function getMissingAssetsAsync(buildManifestPath, exportMetadataPath, assetMapPath, platform) {
    const buildManifestHashSet = getBuildManifestHashSet(await getBuildManifestAsync(buildManifestPath));
    const fullAssetDump = await getFullAssetDumpAsync(assetMapPath);
    const { fullAssetHashSet, fullAssetHashMap } = getFullAssetDumpHashSet(fullAssetDump);
    const exportedAssetSet = getExportedMetadataHashSet(await getExportedMetadataAsync(exportMetadataPath), platform);
    debug(`Assets in build: ${JSON.stringify([...buildManifestHashSet], null, 2)}`);
    debug(`Assets in exported bundle: ${JSON.stringify([...exportedAssetSet], null, 2)}`);
    debug(`All assets resolved by Metro: ${JSON.stringify([...fullAssetHashSet], null, 2)}`);
    const buildAssetsPlusExportedAssets = new Set(buildManifestHashSet);
    exportedAssetSet.forEach((hash) => buildAssetsPlusExportedAssets.add(hash));
    const missingAssets = [];
    fullAssetHashSet.forEach((hash) => {
        if (!buildAssetsPlusExportedAssets.has(hash)) {
            const asset = fullAssetHashMap.get(hash);
            asset?.fileHashes.forEach((fileHash, index) => {
                if (asset?.fileHashes[index] === hash) {
                    missingAssets.push({
                        hash,
                        path: asset?.files[index],
                    });
                }
            });
        }
    });
    return missingAssets;
}
exports.getMissingAssetsAsync = getMissingAssetsAsync;
/**
 * Reads and returns the embedded manifest (app.manifest) for a build.
 *
 * @param buildManifestPath Path to the build folder
 * @param platform Either 'android' or 'ios'
 * @param projectRoot The project root path
 * @returns the JSON structure of the manifest
 */
async function getBuildManifestAsync(buildManifestPath) {
    const buildManifestString = await fs_1.promises.readFile(buildManifestPath, { encoding: 'utf-8' });
    const buildManifest = JSON.parse(buildManifestString);
    return buildManifest;
}
exports.getBuildManifestAsync = getBuildManifestAsync;
/**
 * Extracts the set of asset hashes from a build manifest.
 *
 * @param buildManifest The build manifest
 * @returns The set of asset hashes contained in the build manifest
 */
function getBuildManifestHashSet(buildManifest) {
    return new Set((buildManifest.assets ?? []).map((asset) => asset.packagerHash));
}
exports.getBuildManifestHashSet = getBuildManifestHashSet;
/**
 * Reads and extracts the asset dump for an exported bundle.
 *
 * @param assetMapPath The path to the exported assetmap.json.
 * @returns The asset dump as an object.
 */
async function getFullAssetDumpAsync(assetMapPath) {
    const assetMapString = await fs_1.promises.readFile(assetMapPath, { encoding: 'utf-8' });
    const assetMap = new Map(Object.entries(JSON.parse(assetMapString)));
    return assetMap;
}
exports.getFullAssetDumpAsync = getFullAssetDumpAsync;
/**
 * Extracts the set of asset hashes from an asset dump.
 *
 * @param assetDump
 * @returns The set of asset hashes in the asset dump, and a map of hash to asset
 */
function getFullAssetDumpHashSet(assetDump) {
    const fullAssetHashSet = new Set();
    const fullAssetHashMap = new Map();
    assetDump.forEach((asset) => asset.fileHashes.forEach((hash) => {
        fullAssetHashSet.add(hash);
        fullAssetHashMap.set(hash, asset);
    }));
    return {
        fullAssetHashSet,
        fullAssetHashMap,
    };
}
exports.getFullAssetDumpHashSet = getFullAssetDumpHashSet;
/**
 * Reads and extracts the metadata.json from an exported bundle.
 *
 * @param exportedMetadataPath Path to the exported metadata.json.
 * @returns The metadata of the bundle.
 */
async function getExportedMetadataAsync(exportedMetadataPath) {
    const metadataString = await fs_1.promises.readFile(exportedMetadataPath, { encoding: 'utf-8' });
    const metadata = JSON.parse(metadataString);
    return metadata;
}
exports.getExportedMetadataAsync = getExportedMetadataAsync;
/**
 * Extracts the set of asset hashes from an exported bundle's metadata for a given platform.
 *
 * @param metadata The metadata from the exported bundle
 * @param platform Either 'android' or 'ios'
 * @returns the set of asset hashes
 */
function getExportedMetadataHashSet(metadata, platform) {
    const fileMetadata = platform === 'android' ? metadata.fileMetadata.android : metadata.fileMetadata.ios;
    if (!fileMetadata) {
        throw new errors_1.CommandError(`Exported bundle was not exported for platform ${platform}`);
    }
    const assets = fileMetadata?.assets ?? [];
    // Asset paths in the export metadata are of the form 'assets/<hash string>'
    return new Set(assets.map((asset) => asset.path.substring(7, asset.path.length)));
}
exports.getExportedMetadataHashSet = getExportedMetadataHashSet;
