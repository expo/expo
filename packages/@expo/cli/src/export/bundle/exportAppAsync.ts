import path from 'path';

import * as Log from '../../log';
import { ensureDirectoryAsync } from '../../utils/dir';
import { Options } from '../resolveOptions';
import { createBundlesAsync } from './createBundles';
import { exportAssetsAsync } from './exportAssets';
import { getPublicExpoManifestAsync } from './getPublicExpoManifest';
import { printBundleSizes } from './printBundleSizes';
import {
  writeAssetMapAsync,
  writeBundlesAsync,
  writeDebugHtmlAsync,
  writeMetadataJsonAsync,
  writeSourceMapsAsync,
} from './writeContents';

/**
 * The structure of the outputDir will be:
 *
 * ```
 * ├── assets
 * │   └── *
 * ├── bundles
 * │   ├── android-01ee6e3ab3e8c16a4d926c91808d5320.js
 * │   └── ios-ee8206cc754d3f7aa9123b7f909d94ea.js
 * └── metadata.json
 * ```
 */
export async function exportAppAsync(
  projectRoot: string,
  {
    platforms,
    outputDir,
    clear,
    dev,
    dumpAssetmap,
    dumpSourcemap,
  }: Pick<Options, 'dumpAssetmap' | 'dumpSourcemap' | 'dev' | 'clear' | 'outputDir' | 'platforms'>
): Promise<void> {
  const exp = await getPublicExpoManifestAsync(projectRoot);

  const absoluteOutputDir = path.resolve(projectRoot, outputDir);

  const assetPathToWrite = path.resolve(absoluteOutputDir, 'assets');
  const bundlesPathToWrite = path.resolve(absoluteOutputDir, 'bundles');

  await Promise.all([assetPathToWrite, bundlesPathToWrite].map(ensureDirectoryAsync));

  // Run metro bundler and create the JS bundles/source maps.
  const bundles = await createBundlesAsync(
    projectRoot,
    { resetCache: !!clear },
    {
      platforms,
      dev,
      useDevServer: true,
      // TODO: Disable source map generation if we aren't outputting them.
    }
  );

  // Log bundle size info to the user
  printBundleSizes(bundles);

  // Write the JS bundles to disk, and get the bundle file names (this could change with async chunk loading support).
  const { hashes, fileNames } = await writeBundlesAsync({ bundles, outputDir: bundlesPathToWrite });

  Log.log('Finished saving JS Bundles');

  const { assets } = await exportAssetsAsync(projectRoot, {
    exp,
    outputDir: absoluteOutputDir,
    bundles,
  });

  if (dumpAssetmap) {
    Log.log('Dumping asset map');
    await writeAssetMapAsync({ outputDir: absoluteOutputDir, assets });
  }

  // build source maps
  if (dumpSourcemap) {
    await writeSourceMapsAsync({
      bundles,
      hashes,
      outputDir: bundlesPathToWrite,
      fileNames,
    });
    // If we output source maps, then add a debug HTML file which the user can open in
    // the web browser to inspect the output like web.
    await writeDebugHtmlAsync({
      outputDir: absoluteOutputDir,
      fileNames,
    });
  }

  // Generate a `metadata.json` and the export is complete.
  await writeMetadataJsonAsync({ outputDir, bundles, fileNames });
}
