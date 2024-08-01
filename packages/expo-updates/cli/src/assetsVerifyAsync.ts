import { promises as fs } from 'fs';

import {
  BuildManifest,
  ExportedMetadata,
  ExportedMetadataAsset,
  FullAssetDump,
  FullAssetDumpEntry,
  MissingAsset,
  Platform,
} from './assetsVerifyTypes';
import { CommandError } from './utils/errors';

const debug = require('debug')('expo-updates:assets:verify') as typeof console.log;

/**
 * Finds any assets that will be missing from an app given a build and an exported update bundle.
 *
 * @param buildManifestPath Path to the `app.manifest` file created by expo-updates in an Expo application build (either ios or android)
 * @param exportMetadataPath Path to the `metadata.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param assetMapPath Path to the `assetmap.json` in an export produced by the command `npx expo export --dump-assetmap`
 * @param projectRoot The project root path
 * @returns An array containing any assets that are found in the Metro asset dump, but not included in either app.manifest or the exported bundle
 */
export async function getMissingAssetsAsync(
  buildManifestPath: string,
  exportMetadataPath: string,
  assetMapPath: string,
  platform: Platform
) {
  const buildManifestHashSet = getBuildManifestHashSet(
    await getBuildManifestAsync(buildManifestPath)
  );

  const fullAssetDump = await getFullAssetDumpAsync(assetMapPath);
  const { fullAssetHashSet, fullAssetHashMap } = getFullAssetDumpHashSet(fullAssetDump);

  const exportedAssetSet = getExportedMetadataHashSet(
    await getExportedMetadataAsync(exportMetadataPath),
    platform
  );

  debug(`Assets in build: ${JSON.stringify([...buildManifestHashSet], null, 2)}`);
  debug(`Assets in exported bundle: ${JSON.stringify([...exportedAssetSet], null, 2)}`);
  debug(`All assets resolved by Metro: ${JSON.stringify([...fullAssetHashSet], null, 2)}`);

  const buildAssetsPlusExportedAssets = new Set(buildManifestHashSet);
  exportedAssetSet.forEach((hash) => buildAssetsPlusExportedAssets.add(hash));

  const missingAssets: MissingAsset[] = [];

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

/**
 * Reads and returns the embedded manifest (app.manifest) for a build.
 *
 * @param buildManifestPath Path to the build folder
 * @param platform Either 'android' or 'ios'
 * @param projectRoot The project root path
 * @returns the JSON structure of the manifest
 */
export async function getBuildManifestAsync(buildManifestPath: string) {
  const buildManifestString = await fs.readFile(buildManifestPath, { encoding: 'utf-8' });
  const buildManifest: BuildManifest = JSON.parse(buildManifestString);
  return buildManifest;
}

/**
 * Extracts the set of asset hashes from a build manifest.
 *
 * @param buildManifest The build manifest
 * @returns The set of asset hashes contained in the build manifest
 */
export function getBuildManifestHashSet(buildManifest: BuildManifest) {
  return new Set((buildManifest.assets ?? []).map((asset) => asset.packagerHash));
}

/**
 * Reads and extracts the asset dump for an exported bundle.
 *
 * @param assetMapPath The path to the exported assetmap.json.
 * @returns The asset dump as an object.
 */
export async function getFullAssetDumpAsync(assetMapPath: string) {
  const assetMapString = await fs.readFile(assetMapPath, { encoding: 'utf-8' });
  const assetMap: FullAssetDump = new Map(Object.entries(JSON.parse(assetMapString)));
  return assetMap;
}

/**
 * Extracts the set of asset hashes from an asset dump.
 *
 * @param assetDump
 * @returns The set of asset hashes in the asset dump, and a map of hash to asset
 */
export function getFullAssetDumpHashSet(assetDump: FullAssetDump) {
  const fullAssetHashSet = new Set<string>();
  const fullAssetHashMap = new Map<string, FullAssetDumpEntry>();
  assetDump.forEach((asset) =>
    asset.fileHashes.forEach((hash) => {
      fullAssetHashSet.add(hash);
      fullAssetHashMap.set(hash, asset);
    })
  );
  return {
    fullAssetHashSet,
    fullAssetHashMap,
  };
}

/**
 * Reads and extracts the metadata.json from an exported bundle.
 *
 * @param exportedMetadataPath Path to the exported metadata.json.
 * @returns The metadata of the bundle.
 */
export async function getExportedMetadataAsync(exportedMetadataPath: string) {
  const metadataString = await fs.readFile(exportedMetadataPath, { encoding: 'utf-8' });
  const metadata: ExportedMetadata = JSON.parse(metadataString);
  return metadata;
}

/**
 * Extracts the set of asset hashes from an exported bundle's metadata for a given platform.
 *
 * @param metadata The metadata from the exported bundle
 * @param platform Either 'android' or 'ios'
 * @returns the set of asset hashes
 */
export function getExportedMetadataHashSet(metadata: ExportedMetadata, platform: Platform) {
  const fileMetadata =
    platform === 'android' ? metadata.fileMetadata.android : metadata.fileMetadata.ios;
  if (!fileMetadata) {
    throw new CommandError(`Exported bundle was not exported for platform ${platform}`);
  }
  const assets: ExportedMetadataAsset[] = fileMetadata?.assets ?? [];
  // Asset paths in the export metadata are of the form 'assets/<hash string>'
  return new Set(assets.map((asset) => asset.path.substring(7, asset.path.length)));
}
