import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import fs from 'fs';
import minimatch from 'minimatch';
import path from 'path';

import { BundleOutput } from './fork-bundleAsync';
import { Asset, saveAssetsAsync } from './saveAssets';
import * as Log from '../log';
import { resolveGoogleServicesFile } from '../start/server/middleware/resolveAssets';
import { uniqBy } from '../utils/array';

const debug = require('debug')('expo:export:exportAssets') as typeof console.log;

function mapAssetHashToAssetString(asset: Asset, hash: string) {
  return 'asset_' + hash + ('type' in asset && asset.type ? '.' + asset.type : '');
}

export function assetPatternsToBeBundled(
  exp: ExpoConfig & { extra?: { assetPatternsToBeBundled?: string[] } }
): string[] | undefined {
  return exp?.extra?.assetPatternsToBeBundled?.length
    ? exp?.extra?.assetPatternsToBeBundled
    : undefined;
}

/**
 * Given an asset and a set of strings representing the assets to be bundled, returns true if
 * the asset is part of the set to be bundled.
 * @param asset Asset object
 * @param bundledAssetsSet Set of strings
 * @returns true if the asset should be bundled
 */
export function assetShouldBeIncludedInExport(
  asset: Asset,
  bundledAssetsSet: Set<string> | undefined
) {
  if (!bundledAssetsSet) {
    return true;
  }
  return (
    asset.fileHashes.filter((hash) => bundledAssetsSet?.has(mapAssetHashToAssetString(asset, hash)))
      .length > 0 ?? false
  );
}

/**
 * Computes a set of strings representing the assets to be bundled with an export, given an array of assets,
 * and a set of patterns to match
 * @param assets The asset array
 * @param assetPatternsToBeBundled An array of strings with glob patterns to match
 * @param projectRoot The project root
 * @returns A set of asset strings
 */
export function setOfAssetsToBeBundled(
  assets: Asset[],
  assetPatternsToBeBundled: string[],
  projectRoot: string
): Set<string> {
  // Convert asset patterns to a list of asset strings that match them.
  // Assets strings are formatted as `asset_<hash>.<type>` and represent
  // the name that the file will have in the app bundle. The `asset_` prefix is
  // needed because android doesn't support assets that start with numbers.

  const fullPatterns: string[] = assetPatternsToBeBundled.map((p: string) =>
    path.join(projectRoot, p)
  );

  logPatterns(fullPatterns);

  const allBundledAssets = assets
    .map((asset) => {
      const shouldBundle = shouldBundleAsset(asset, fullPatterns);
      if (shouldBundle) {
        debug(`${shouldBundle ? 'Include' : 'Exclude'} asset ${asset.files?.[0]}`);
        return asset.fileHashes.map((hash) => mapAssetHashToAssetString(asset, hash));
      }
      return [];
    })
    .flat();

  // The assets returned by the RN packager has duplicates so make sure we
  // only bundle each once.
  return new Set(allBundledAssets);
}

/**
 * Resolves the assetBundlePatterns from the manifest and returns a list of assets to bundle.
 *
 * @modifies {exp}
 */
export async function resolveAssetPatternsToBeBundledAsync<T extends ExpoConfig>(
  projectRoot: string,
  exp: T,
  assets: Asset[]
): Promise<T & { bundledAssets?: Set<string> }> {
  if (!assetPatternsToBeBundled(exp)) {
    return exp;
  }
  (exp as any).bundledAssets = setOfAssetsToBeBundled(
    assets,
    assetPatternsToBeBundled(exp) ?? ['**/*'],
    projectRoot
  );
  delete exp.assetBundlePatterns;

  return exp;
}

function logPatterns(patterns: string[]) {
  // Only log the patterns in debug mode, if they aren't already defined in the app.json, then all files will be targeted.
  Log.log('\nProcessing asset bundle patterns:');
  patterns.forEach((p) => Log.log('- ' + p));
}

function shouldBundleAsset(asset: Asset, patterns: string[]) {
  const file = asset.files?.[0];
  return !!(
    '__packager_asset' in asset &&
    asset.__packager_asset &&
    file &&
    patterns.some((pattern) => minimatch(file, pattern))
  );
}

export async function exportAssetsAsync(
  projectRoot: string,
  {
    exp,
    outputDir,
    bundles,
  }: {
    exp: ExpoConfig;
    bundles: Partial<Record<ModPlatform, BundleOutput>>;
    outputDir: string;
  }
) {
  const assets: Asset[] = uniqBy(
    Object.values(bundles).flatMap((bundle) => bundle!.assets),
    (asset) => asset.hash
  );

  if (assets[0]?.fileHashes) {
    debug(`Assets = ${JSON.stringify(assets, null, 2)}`);
    // Updates the manifest to reflect additional asset bundling + configs
    // Get only asset strings for assets we will save
    await resolveAssetPatternsToBeBundledAsync(projectRoot, exp, assets);
    const bundledAssetsSet = (exp as any).bundledAssets;
    let filteredAssets = assets;
    if (bundledAssetsSet) {
      debug(`Bundled assets = ${JSON.stringify([...bundledAssetsSet], null, 2)}`);
      // Filter asset objects to only ones that include assetBundlePatterns matches
      filteredAssets = assets.filter((asset) =>
        assetShouldBeIncludedInExport(asset, bundledAssetsSet)
      );
      debug(`Filtered assets count = ${filteredAssets.length}`);
    }
    Log.log('Saving assets');
    await saveAssetsAsync(projectRoot, { assets: filteredAssets, outputDir });
  }

  // Add google services file if it exists
  await resolveGoogleServicesFile(projectRoot, exp);

  bundles.ios?.assets.forEach((asset: any) => {
    // Mark assets to be removed from metadata
    if (!assetShouldBeIncludedInExport(asset, (exp as any).bundledAssets)) {
      asset.embedded = true;
    }
  });
  bundles.android?.assets.forEach((asset: any) => {
    // Mark assets to be removed from metadata
    if (!assetShouldBeIncludedInExport(asset, (exp as any).bundledAssets)) {
      asset.embedded = true;
    }
  });
  return { exp, assets };
}

export async function exportCssAssetsAsync({
  outputDir,
  bundles,
  basePath,
}: {
  bundles: Partial<Record<ModPlatform, BundleOutput>>;
  outputDir: string;
  basePath: string;
}) {
  const assets = uniqBy(
    Object.values(bundles).flatMap((bundle) => bundle!.css),
    (asset) => asset.filename
  );

  const cssDirectory = assets[0]?.filename;
  if (!cssDirectory) return [];

  await fs.promises.mkdir(path.join(outputDir, path.dirname(cssDirectory)), { recursive: true });

  await Promise.all(
    assets.map((v) => fs.promises.writeFile(path.join(outputDir, v.filename), v.source))
  );

  return assets.map((v) => basePath + '/' + v.filename);
}
