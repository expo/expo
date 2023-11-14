import { getConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { exportAssetsAsync } from './exportAssets';
import {
  getFilesFromSerialAssets,
  persistMetroFilesAsync,
  unstable_exportStaticAsync,
} from './exportStaticAsync';
import { getVirtualFaviconAssetsAsync } from './favicon';
import { createBundlesAsync } from './fork-bundleAsync';
import { getPublicExpoManifestAsync } from './getPublicExpoManifest';
import { Options } from './resolveOptions';
import { writeAssetMapAsync, writeDebugHtmlAsync, writeMetadataJsonAsync } from './writeContents';
import * as Log from '../log';
import { getBaseUrlFromExpoConfig } from '../start/server/middleware/metroOptions';
import { createTemplateHtmlFromExpoConfigAsync } from '../start/server/webTemplate';
import { copyAsync, ensureDirectoryAsync } from '../utils/dir';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';

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
    sourceMaps,
    minify,
  }: Pick<
    Options,
    'dumpAssetmap' | 'sourceMaps' | 'dev' | 'clear' | 'outputDir' | 'platforms' | 'minify'
  >
): Promise<void> {
  setNodeEnv(dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const projectConfig = getConfig(projectRoot);
  const exp = await getPublicExpoManifestAsync(projectRoot, {
    // Web doesn't require validation.
    skipValidation: platforms.length === 1 && platforms[0] === 'web',
  });

  const useServerRendering = ['static', 'server'].includes(exp.web?.output ?? '');
  const baseUrl = getBaseUrlFromExpoConfig(exp);

  // Print out logs
  if (baseUrl) {
    Log.log();
    Log.log(chalk.gray`Using (experimental) base path: ${baseUrl}`);
    // Warn if not using an absolute path.
    if (!baseUrl.startsWith('/')) {
      Log.log(
        chalk.yellow`  Base path does not start with a slash. Requests will not be absolute.`
      );
    }
  }

  const publicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);

  const outputPath = path.resolve(projectRoot, outputDir);
  const assetsPath = path.join(outputPath, 'assets');

  await Promise.all([assetsPath].map(ensureDirectoryAsync));

  await copyPublicFolderAsync(publicPath, outputPath);

  // Run metro bundler and create the JS bundles/source maps.
  const bundles = await createBundlesAsync(projectRoot, projectConfig, {
    clear: !!clear,
    minify,
    sourcemaps: sourceMaps,
    platforms: useServerRendering ? platforms.filter((platform) => platform !== 'web') : platforms,
    dev,
  });

  // Write the JS bundles to disk, and get the bundle file names (this could change with async chunk loading support).

  const files = new Map<string, string>();
  Object.values(bundles).forEach((bundle) => {
    getFilesFromSerialAssets(bundle.artifacts, {
      includeMaps: sourceMaps,
      files,
    });
  });
  await persistMetroFilesAsync(files, outputPath);

  const bundleEntries = Object.entries(bundles);
  // Can be empty during web-only SSG.
  if (bundleEntries.length) {
    // TODO: Improve logging the bundle sizes

    // TODO: Use same asset system across platforms again.
    const { assets, embeddedHashSet } = await exportAssetsAsync(projectRoot, {
      exp,
      outputDir: outputPath,
      bundles,
      baseUrl,
    });

    if (dumpAssetmap) {
      Log.log('Dumping asset map');
      await writeAssetMapAsync({ outputDir: outputPath, assets });
    }

    const fileNames = Object.fromEntries(
      Object.entries(bundles).map(([platform, bundle]) => [
        platform,
        bundle.artifacts.filter((asset) => asset.type === 'js').map((asset) => asset.filename),
      ])
    );

    // build source maps
    if (sourceMaps) {
      Log.log('Preparing additional debugging files');
      // If we output source maps, then add a debug HTML file which the user can open in
      // the web browser to inspect the output like web.
      await writeDebugHtmlAsync({
        outputDir: outputPath,
        fileNames: Object.values(fileNames).flat(),
      });
    }

    // Generate a `metadata.json` and the export is complete.
    await writeMetadataJsonAsync({ outputDir: outputPath, bundles, fileNames, embeddedHashSet });
  }

  // Additional web-only steps...

  if (!platforms.includes('web')) {
    return;
  }

  if (useServerRendering) {
    await unstable_exportStaticAsync(projectRoot, {
      clear: !!clear,
      outputDir: outputPath,
      minify,
      baseUrl,
      includeMaps: sourceMaps,
      // @ts-expect-error: server not on type yet
      exportServer: exp.web?.output === 'server',
    });
    Log.log('Finished saving static files');
  } else {
    // TODO: Unify with exportStaticAsync
    // TODO: Maybe move to the serializer.
    let html = await serializeHtmlWithAssets({
      mode: 'production',
      resources: bundles.web!.artifacts,
      template: await createTemplateHtmlFromExpoConfigAsync(projectRoot, {
        scripts: [],
        cssLinks: [],
      }),
      baseUrl,
    });

    // Add the favicon assets to the HTML.
    const modifyHtml = await getVirtualFaviconAssetsAsync(projectRoot, {
      outputDir,
      baseUrl,
    });
    if (modifyHtml) {
      html = modifyHtml(html);
    }
    // Generate SPA-styled HTML file.
    // If web exists, then write the template HTML file.
    await fs.promises.writeFile(path.join(outputPath, 'index.html'), html);
  }
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
