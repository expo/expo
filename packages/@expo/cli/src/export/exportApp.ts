import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { exportAppleAppSiteAssociationAsync } from '../start/platforms/ios/association/aasa';
import { importCliSaveAssetsFromProject } from '../start/server/metro/resolveFromProject';
import { createTemplateHtmlFromExpoConfigAsync } from '../start/server/webTemplate';
import { copyAsync, ensureDirectoryAsync } from '../utils/dir';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';
import { createBundlesAsync } from './createBundles';
import { exportAssetsAsync } from './exportAssets';
import { unstable_exportStaticAsync } from './exportStaticAsync';
import { getPublicExpoManifestAsync } from './getPublicExpoManifest';
import { printBundleSizes } from './printBundleSizes';
import { Options } from './resolveOptions';
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
  setNodeEnv(dev ? 'development' : 'production');

  const exp = await getPublicExpoManifestAsync(projectRoot);

  const publicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);

  const outputPath = path.resolve(projectRoot, outputDir);
  const staticFolder = outputPath;
  const assetsPath = path.join(staticFolder, 'assets');
  const bundlesPath = path.join(staticFolder, 'bundles');

  await Promise.all([assetsPath, bundlesPath].map(ensureDirectoryAsync));

  await copyPublicFolderAsync(publicPath, staticFolder);

  // Run metro bundler and create the JS bundles/source maps.
  const bundles = await createBundlesAsync(
    projectRoot,
    { resetCache: !!clear },
    {
      platforms,
      dev,
      // TODO: Disable source map generation if we aren't outputting them.
    }
  );

  // Log bundle size info to the user
  printBundleSizes(
    Object.fromEntries(
      Object.entries(bundles).map(([key, value]) => {
        if (!dumpSourcemap) {
          return [
            key,
            {
              ...value,
              // Remove source maps from the bundles if they aren't going to be written.
              map: undefined,
            },
          ];
        }

        return [key, value];
      })
    )
  );

  // Write the JS bundles to disk, and get the bundle file names (this could change with async chunk loading support).
  const { hashes, fileNames } = await writeBundlesAsync({ bundles, outputDir: bundlesPath });

  Log.log('Finished saving JS Bundles');

  if (fileNames.web) {
    if (env.EXPO_USE_STATIC) {
      await unstable_exportStaticAsync(projectRoot, {
        outputDir: outputPath,
        scripts: [`/bundles/${fileNames.web}`],
        // TODO: Expose
        minify: true,
      });
      Log.log('Finished saving static files');
    } else {
      // Generate SPA-styled HTML file.
      // If web exists, then write the template HTML file.
      await fs.promises.writeFile(
        path.join(staticFolder, 'index.html'),
        await createTemplateHtmlFromExpoConfigAsync(projectRoot, {
          scripts: [`/bundles/${fileNames.web}`],
        })
      );
    }

    // Save assets like a typical bundler, preserving the file paths on web.
    const saveAssets = importCliSaveAssetsFromProject(projectRoot);
    await Promise.all(
      Object.entries(bundles).map(([platform, bundle]) => {
        return saveAssets(
          // @ts-expect-error: tolerable type mismatches: unused `readonly` (common in Metro) and `undefined` instead of `null`.
          bundle.assets,
          platform,
          staticFolder,
          undefined
        );
      })
    );

    // Write the apple app site association file for web.
    await exportAppleAppSiteAssociationAsync(projectRoot, outputPath);
  }

  const { assets } = await exportAssetsAsync(projectRoot, {
    exp,
    outputDir: staticFolder,
    bundles,
  });

  if (dumpAssetmap) {
    Log.log('Dumping asset map');
    await writeAssetMapAsync({ outputDir: staticFolder, assets });
  }

  // build source maps
  if (dumpSourcemap) {
    Log.log('Dumping source maps');
    await writeSourceMapsAsync({
      bundles,
      hashes,
      outputDir: bundlesPath,
      fileNames,
    });

    Log.log('Preparing additional debugging files');
    // If we output source maps, then add a debug HTML file which the user can open in
    // the web browser to inspect the output like web.
    await writeDebugHtmlAsync({
      outputDir: staticFolder,
      fileNames,
    });
  }

  // Generate a `metadata.json` and the export is complete.
  await writeMetadataJsonAsync({ outputDir: staticFolder, bundles, fileNames });
}

/**
 * Copy the contents of the public folder into the output folder.
 * This enables users to add static files like `favicon.ico` or `serve.json`.
 *
 * The contents of this folder are completely universal since they refer to
 * static network requests which fall outside the scope of React Native's magic
 * platform resolution patterns.
 */
async function copyPublicFolderAsync(publicFolder: string, outputFolder: string) {
  if (fs.existsSync(publicFolder)) {
    await copyAsync(publicFolder, outputFolder);
  }
}
