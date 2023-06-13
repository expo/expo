import { ExpoAppManifest } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import fs from 'fs';
import minimatch from 'minimatch';
import path from 'path';

import * as Log from '../log';
import { resolveGoogleServicesFile } from '../start/server/middleware/resolveAssets';
import { uniqBy } from '../utils/array';
import { BundleOutput } from './fork-bundleAsync';
import { Asset, saveAssetsAsync } from './saveAssets';

const debug = require('debug')('expo:export:exportAssets') as typeof console.log;

/**
 * Resolves the assetBundlePatterns from the manifest and returns a list of assets to bundle.
 *
 * @modifies {exp}
 */
export async function resolveAssetBundlePatternsAsync(
  projectRoot: string,
  exp: Pick<ExpoAppManifest, 'bundledAssets' | 'assetBundlePatterns'>,
  assets: Asset[]
) {
  if (!exp.assetBundlePatterns?.length || !assets.length) {
    delete exp.assetBundlePatterns;
    return exp;
  }
  // Convert asset patterns to a list of asset strings that match them.
  // Assets strings are formatted as `asset_<hash>.<type>` and represent
  // the name that the file will have in the app bundle. The `asset_` prefix is
  // needed because android doesn't support assets that start with numbers.

  const fullPatterns: string[] = exp.assetBundlePatterns.map((p: string) =>
    path.join(projectRoot, p)
  );

  logPatterns(fullPatterns);

  const allBundledAssets = assets
    .map((asset) => {
      const shouldBundle = shouldBundleAsset(asset, fullPatterns);
      if (shouldBundle) {
        debug(`${shouldBundle ? 'Include' : 'Exclude'} asset ${asset.files?.[0]}`);
        return asset.fileHashes.map(
          (hash) => 'asset_' + hash + ('type' in asset && asset.type ? '.' + asset.type : '')
        );
      }
      return [];
    })
    .flat();

  // The assets returned by the RN packager has duplicates so make sure we
  // only bundle each once.
  exp.bundledAssets = [...new Set(allBundledAssets)];
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
    exp: ExpoAppManifest;
    bundles: Partial<Record<ModPlatform, BundleOutput>>;
    outputDir: string;
  }
) {
  const assets: Asset[] = uniqBy(
    Object.values(bundles).flatMap((bundle) => bundle!.assets),
    (asset) => asset.hash
  );

  if (assets[0]?.fileHashes) {
    Log.log('Saving assets');
    await saveAssetsAsync(projectRoot, { assets, outputDir });
  }

  // Add google services file if it exists
  await resolveGoogleServicesFile(projectRoot, exp);

  // Updates the manifest to reflect additional asset bundling + configs
  await resolveAssetBundlePatternsAsync(projectRoot, exp, assets);

  return { exp, assets };
}

export async function exportCssAssetsAsync({
  outputDir,
  bundles,
}: {
  bundles: Partial<Record<ModPlatform, BundleOutput>>;
  outputDir: string;
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

  return assets.map((v) => '/' + v.filename);
}
