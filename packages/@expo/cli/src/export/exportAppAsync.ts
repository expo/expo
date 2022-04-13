import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { resolvePlatformOption } from '../prebuild/resolveOptions';
import { createBundlesAsync } from './createBundles';
import { exportAssetsAsync } from './exportAssets';
import { getPublishExpConfigAsync } from './getPublishExpConfig';
import { printBundleSizes } from './printBundleSizes';
import { Options } from './resolveOptions';
import {
  writeAssetMapAsync,
  writeBundlesAsync,
  writeDebugHtmlAsync,
  writeMetadataJsonAsync,
  writeSourceMapsAsync,
} from './writeContents';

export const ANONYMOUS_USERNAME = 'anonymous';

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
  options: Pick<
    Options,
    'dumpAssetmap' | 'dumpSourcemap' | 'dev' | 'clear' | 'outputDir' | 'platform'
  >
): Promise<void> {
  const platforms = resolvePlatformOption(options.platform, { loose: true });

  const { exp } = await getPublishExpConfigAsync(projectRoot, {});

  const absoluteOutputDir = path.resolve(projectRoot, options.outputDir);

  const assetPathToWrite = path.resolve(absoluteOutputDir, 'assets');
  const bundlesPathToWrite = path.resolve(absoluteOutputDir, 'bundles');

  await Promise.all([
    fs.promises.mkdir(assetPathToWrite, { recursive: true }),
    fs.promises.mkdir(bundlesPathToWrite, { recursive: true }),
  ]);

  // Run metro bundler and create the JS bundles/source maps.
  const bundles = await createBundlesAsync(
    projectRoot,
    { resetCache: !!options.clear },
    {
      platforms,
      dev: options.dev,
      useDevServer: true,
      // TODO: Disable source map generation if we aren't outputting them.
    }
  );

  // Log bundle size info to the user
  printBundleSizes(bundles);

  // Write the JS bundles to disk, and get the bundle file names (this could change with async chunk loading support).
  const { hashes, fileNames } = await writeBundlesAsync({ bundles, outputDir: bundlesPathToWrite });

  Log.log('Finished saving JS Bundles');

  const { assets } = await exportAssetsAsync({
    projectRoot,
    exp,
    outputDir: absoluteOutputDir,
    bundles,
  });

  if (options.dumpAssetmap) {
    Log.log('Dumping asset map');
    await writeAssetMapAsync({ outputDir: absoluteOutputDir, assets });
  }

  // build source maps
  if (options.dumpSourcemap) {
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

  // Skip the hooks and manifest creation if building for EAS.

  // Generate a metadata.json and bail.
  await writeMetadataJsonAsync({ outputDir: options.outputDir, bundles, fileNames });
}
