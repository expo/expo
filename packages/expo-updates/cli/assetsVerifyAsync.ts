import { promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';

import {
  BuildManifest,
  ExportedMetadata,
  ExportedMetadataAsset,
  FullAssetDump,
  FullAssetDumpEntry,
  Platform,
} from './assetsVerifyTypes';
import * as Log from './utils/log';

/**
 * Finds any assets that will be missing from an app given a build and an exported update bundle.
 *
 * @param buildPath Path to an EAS or local build containing an expo-updates embedded manifest (app.manifest)
 * @param exportPath Path to a directory produced by the command `npx expo export --dump-assetmap`
 * @param platform Either `android` or `ios`
 * @param projectRoot The project root path
 * @returns An array containing any assets that are found in the Metro asset dump, but not included in either app.manifest or the exported bundle
 */
export async function getMissingAssetsAsync(
  buildPath: string,
  exportPath: string,
  platform: Platform,
  projectRoot: string
) {
  const buildManifestHashSet = getBuildManifestHashSet(
    await getBuildManifestAsync(buildPath, platform, projectRoot)
  );

  const fullAssetMap = await getFullAssetDumpAsync(exportPath);
  const fullAssetSet = getFullAssetDumpHashSet(fullAssetMap);

  const exportedAssetSet = getExportedMetadataHashSet(
    await getExportedMetadataAsync(exportPath),
    platform
  );

  Log.log(`Assets in build: ${JSON.stringify([...buildManifestHashSet], null, 2)}`);
  Log.log(`Assets in exported bundle: ${JSON.stringify([...exportedAssetSet], null, 2)}`);
  Log.log(`All assets resolved by Metro: ${JSON.stringify([...fullAssetSet], null, 2)}`);

  const buildAssetsPlusExportedAssets = new Set(buildManifestHashSet);
  exportedAssetSet.forEach((hash) => buildAssetsPlusExportedAssets.add(hash));

  const missingAssets: FullAssetDumpEntry[] = [];

  fullAssetSet.forEach((hash) => {
    if (!buildAssetsPlusExportedAssets.has(hash)) {
      const asset = fullAssetMap.get(hash);
      asset && missingAssets.push(asset);
    }
  });

  return missingAssets;
}

/**
 * Reads and returns the embedded manifest (app.manifest) for a build.
 *
 * @param buildPath Path to the build folder
 * @param platform Either 'android' or 'ios'
 * @param projectRoot The project root path
 * @returns the JSON structure of the manifest
 */
export async function getBuildManifestAsync(
  buildPath: string,
  platform: Platform,
  projectRoot: string
) {
  let realBuildPath = buildPath;
  if (buildPath === projectRoot) {
    switch (platform) {
      case 'android':
        realBuildPath = path.resolve(projectRoot, 'android', 'app', 'build');
        break;
      default:
        realBuildPath = path.resolve(projectRoot, 'ios', 'build');
        break;
    }
  }
  const buildManifestPaths = glob.sync(`${realBuildPath}/**/app.manifest`);
  if (buildManifestPaths.length === 0) {
    throw new Error(`No app.manifest found in build path`);
  }
  const buildManifestPath = buildManifestPaths[0];
  Log.log(`Build manifest found at ${buildManifestPath}`);
  const buildManifestString = await fs.readFile(buildManifestPaths[0], { encoding: 'utf-8' });
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
 * @param exportPath The path to the exported bundle containing an asset dump.
 * @returns The asset dump as an object.
 */
export async function getFullAssetDumpAsync(exportPath: string) {
  const assetMapPath = path.resolve(exportPath, 'assetmap.json');
  try {
    const assetMapString = await fs.readFile(assetMapPath, { encoding: 'utf-8' });
    const assetMap: FullAssetDump = new Map(Object.entries(JSON.parse(assetMapString)));
    return assetMap;
  } catch (e) {
    const errorMessage = `${e}`;
    if (errorMessage.includes('ENOENT')) {
      throw new Error(
        `The export bundle chosen does not contain assetmap.json. Please generate the bundle with "npx expo export --dump-assetmap"`
      );
    }
    throw e;
  }
}

/**
 * Extracts the set of asset hashes from an asset dump.
 *
 * @param assetDump
 * @returns The set of asset hashes in the asset dump
 */
export function getFullAssetDumpHashSet(assetDump: FullAssetDump) {
  return new Set(assetDump.keys());
}

/**
 * Reads and extracts the metadata from an exported bundle.
 *
 * @param exportPath Path to the exported bundle.
 * @returns The metadata of the bundle.
 */
export async function getExportedMetadataAsync(exportPath: string) {
  const metadataPath = path.resolve(exportPath, 'metadata.json');
  try {
    const metadataString = await fs.readFile(metadataPath, { encoding: 'utf-8' });
    const metadata: ExportedMetadata = JSON.parse(metadataString);
    return metadata;
  } catch (e) {
    const errorMessage = `${e}`;
    if (errorMessage.includes('ENOENT')) {
      throw new Error(
        `The export bundle chosen does not contain metadata.json. Please generate the bundle with "npx expo export --dump-assetmap"`
      );
    }
    throw e;
  }
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
    throw new Error(`Exported bundle was not exported for platform ${platform}`);
  }
  const assets: ExportedMetadataAsset[] = fileMetadata?.assets ?? [];
  // Asset paths in the export metadata are of the form 'assets/<hash string>'
  return new Set(assets.map((asset) => asset.path.substring(7, asset.path.length)));
}
