import { ExpoAppManifest } from '@expo/config';
import { BundleOutput } from '@expo/dev-server';
import minimatch from 'minimatch';
import path from 'path';

import * as Log from '../../log';
import { resolveGoogleServicesFile } from '../../start/server/middleware/resolveAssets';
import { uniqBy } from '../../utils/array';
import { Asset, saveAssetsAsync } from './saveAssets';

type BundlesByPlatform = { android?: BundleOutput; ios?: BundleOutput };

type ExportAssetsOptions = {
  projectRoot: string;
  exp: ExpoAppManifest;
  bundles: BundlesByPlatform;
  outputDir: string;
};

/**
 * Configures exp, preparing it for asset export
 *
 * @modifies {exp}
 */
async function updateManifestWithAssets(
  projectRoot: string,
  exp: ExpoAppManifest,
  assets: Asset[]
) {
  // Add google services file if it exists
  await resolveGoogleServicesFile(projectRoot, exp);

  if (!exp.assetBundlePatterns) {
    return exp;
  }
  // Convert asset patterns to a list of asset strings that match them.
  // Assets strings are formatted as `asset_<hash>.<type>` and represent
  // the name that the file will have in the app bundle. The `asset_` prefix is
  // needed because android doesn't support assets that start with numbers.

  const fullPatterns: string[] = exp.assetBundlePatterns.map((p: string) =>
    path.join(projectRoot, p)
  );
  // Only log the patterns in debug mode, if they aren't already defined in the app.json, then all files will be targeted.
  Log.log('\nProcessing asset bundle patterns:');
  fullPatterns.forEach((p) => Log.log('- ' + p));

  // The assets returned by the RN packager has duplicates so make sure we
  // only bundle each once.
  const bundledAssets = new Set<string>();
  for (const asset of assets) {
    const file = asset.files && asset.files[0];
    const shouldBundle =
      '__packager_asset' in asset &&
      asset.__packager_asset &&
      file &&
      fullPatterns.some((p: string) => minimatch(file, p));
    Log.debug(`${shouldBundle ? 'Include' : 'Exclude'} asset ${file}`);
    if (shouldBundle) {
      asset.fileHashes.forEach((hash) =>
        bundledAssets.add('asset_' + hash + ('type' in asset && asset.type ? '.' + asset.type : ''))
      );
    }
  }
  exp.bundledAssets = [...bundledAssets];
  delete exp.assetBundlePatterns;

  return exp;
}

export async function exportAssetsAsync({
  projectRoot,
  exp,
  outputDir,
  bundles,
}: ExportAssetsOptions) {
  const assets: Asset[] = uniqBy(
    Object.values(bundles).flatMap((bundle) => bundle!.assets),
    (asset) => asset.hash
  );

  if (assets.length > 0 && assets[0].fileHashes) {
    Log.log('Saving assets');
    await saveAssetsAsync(projectRoot, assets, outputDir);
  } else {
    Log.log('No assets to upload, skipped.');
  }

  // Updates the manifest to reflect additional asset bundling + configs
  await updateManifestWithAssets(projectRoot, exp, assets);

  return { exp, assets };
}
