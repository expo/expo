import { getConfig } from '@expo/config';
import chalk from 'chalk';
import path from 'path';

import { createMetadataJson } from './createMetadataJson';
import { exportAssetsAsync } from './exportAssets';
import { unstable_exportStaticAsync } from './exportStaticAsync';
import { getVirtualFaviconAssetsAsync } from './favicon';
import { createBundlesAsync } from './fork-bundleAsync';
import { getPublicExpoManifestAsync } from './getPublicExpoManifest';
import { copyPublicFolderAsync } from './publicFolder';
import { Options } from './resolveOptions';
import { ExportAssetMap, getFilesFromSerialAssets, persistMetroFilesAsync } from './saveAssets';
import { createAssetMap, createSourceMapDebugHtml } from './writeContents';
import * as Log from '../log';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import { getBaseUrlFromExpoConfig } from '../start/server/middleware/metroOptions';
import { createTemplateHtmlFromExpoConfigAsync } from '../start/server/webTemplate';
import { ensureDirectoryAsync } from '../utils/dir';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';

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

  const files: ExportAssetMap = new Map();

  Object.values(bundles).forEach((bundle) => {
    getFilesFromSerialAssets(bundle.artifacts, {
      includeSourceMaps: sourceMaps,
      files,
    });
  });

  const bundleEntries = Object.entries(bundles);
  // Can be empty during web-only SSG.
  if (bundleEntries.length) {
    // TODO: Use same asset system across platforms again.
    const { assets, embeddedHashSet } = await exportAssetsAsync(projectRoot, {
      files,
      exp,
      outputDir: outputPath,
      bundles,
      baseUrl,
    });

    if (dumpAssetmap) {
      Log.log('Creating asset map');
      files.set('assetmap.json', { contents: JSON.stringify(createAssetMap({ assets })) });
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
      files.set('debug.html', {
        contents: createSourceMapDebugHtml({
          fileNames: Object.values(fileNames).flat(),
        }),
      });
    }

    // Generate a `metadata.json` for EAS Update.
    const contents = createMetadataJson({
      bundles,
      fileNames,
      embeddedHashSet,
    });
    files.set('metadata.json', { contents: JSON.stringify(contents) });
  }

  // Additional web-only steps...

  if (platforms.includes('web')) {
    if (useServerRendering) {
      await unstable_exportStaticAsync(projectRoot, {
        files,
        clear: !!clear,
        outputDir: outputPath,
        minify,
        baseUrl,
        includeSourceMaps: sourceMaps,
        // @ts-expect-error: server not on type yet
        exportServer: exp.web?.output === 'server',
      });
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
        files,
      });
      if (modifyHtml) {
        html = modifyHtml(html);
      }

      // Generate SPA-styled HTML file.
      // If web exists, then write the template HTML file.
      files.set('index.html', { contents: html });
    }
  }

  // Write all files at the end for unified logging.
  await persistMetroFilesAsync(files, outputPath);
}
