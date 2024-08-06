import { getConfig } from '@expo/config';
import type { Platform } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';
import path from 'path';

import { createMetadataJson } from './createMetadataJson';
import { exportAssetsAsync } from './exportAssets';
import { assertEngineMismatchAsync, isEnableHermesManaged } from './exportHermes';
import { exportApiRoutesAsync } from './exportStaticAsync';
import { getVirtualFaviconAssetsAsync } from './favicon';
import { getPublicExpoManifestAsync } from './getPublicExpoManifest';
import { copyPublicFolderAsync } from './publicFolder';
import { Options } from './resolveOptions';
import {
  ExportAssetMap,
  BundleOutput,
  getFilesFromSerialAssets,
  persistMetroFilesAsync,
} from './saveAssets';
import { createAssetMap, createSourceMapDebugHtml } from './writeContents';
import * as Log from '../log';
import { WebSupportProjectPrerequisite } from '../start/doctor/web/WebSupportProjectPrerequisite';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
// import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import { getEntryWithServerRoot } from '../start/server/middleware/ManifestMiddleware';
import { getBaseUrlFromExpoConfig } from '../start/server/middleware/metroOptions';
import { createTemplateHtmlFromExpoConfigAsync } from '../start/server/webTemplate';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';

export async function exportAppAsync(
  projectRoot: string,
  props: Pick<
    Options,
    | 'dumpAssetmap'
    | 'sourceMaps'
    | 'dev'
    | 'clear'
    | 'outputDir'
    | 'platforms'
    | 'minify'
    | 'bytecode'
    | 'maxWorkers'
  >
): Promise<void> {
  setNodeEnv(props.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const outputPath = path.resolve(projectRoot, props.outputDir);

  const { files } = await exportAppForAssetsAsync(projectRoot, props);

  // Write all files at the end for unified logging.
  await persistMetroFilesAsync(files, outputPath);
}

export async function exportAppForAssetsAsync(
  projectRoot: string,
  {
    platforms,
    outputDir,
    clear,
    dev,
    dumpAssetmap,
    sourceMaps,
    minify,
    bytecode,
    maxWorkers,
  }: Pick<
    Options,
    | 'dumpAssetmap'
    | 'sourceMaps'
    | 'dev'
    | 'clear'
    | 'outputDir'
    | 'platforms'
    | 'minify'
    | 'bytecode'
    | 'maxWorkers'
  >
) {
  const projectConfig = getConfig(projectRoot);
  const exp = await getPublicExpoManifestAsync(projectRoot, {
    // Web doesn't require validation.
    skipValidation: platforms.length === 1 && platforms[0] === 'web',
  });

  if (platforms.includes('web')) {
    await new WebSupportProjectPrerequisite(projectRoot).assertAsync();
  }

  const useServerRendering = ['rsc', 'static', 'server'].includes(exp.web?.output ?? '');
  const baseUrl = getBaseUrlFromExpoConfig(exp);

  if (!bytecode && (platforms.includes('ios') || platforms.includes('android'))) {
    Log.warn(
      `Bytecode makes the app startup faster, disabling bytecode is highly discouraged and should only be used for debugging purposes.`
    );
  }

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

  const mode = dev ? 'development' : 'production';
  const publicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);
  const outputPath = path.resolve(projectRoot, outputDir);

  // Write the JS bundles to disk, and get the bundle file names (this could change with async chunk loading support).

  let metadata: ReturnType<typeof createMetadataJson> = {};
  const files: ExportAssetMap = new Map();

  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, {
    minify,
    mode,
    port: 8081,
    isExporting: true,
    location: {},
    resetDevServer: clear,
    maxWorkers,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const bundles: Partial<Record<Platform, BundleOutput>> = {};

  const spaPlatforms = useServerRendering
    ? platforms.filter((platform) => platform !== 'web')
    : platforms;

  try {
    // NOTE(kitten): The public folder is currently always copied, regardless of targetDomain
    // split. Hence, there's another separate `copyPublicFolderAsync` call below for `web`
    await copyPublicFolderAsync(publicPath, outputPath);

    // Can be empty during web-only SSG.
    if (spaPlatforms.length) {
      await Promise.all(
        spaPlatforms.map(async (platform) => {
          // Assert early so the user doesn't have to wait until bundling is complete to find out that
          // Hermes won't be available.
          const isHermes = isEnableHermesManaged(exp, platform);
          if (isHermes) {
            await assertEngineMismatchAsync(projectRoot, exp, platform);
          }

          // NOTE(EvanBacon): This will not account for client boundaries used in server actions. This will need to be added later.
          const { clientBoundaries, payloads } = await devServer.rscRenderer!.exportRoutesAsync({
            platform,
          });

          console.log('Collected evaluated client boundaries:', clientBoundaries);

          // Run metro bundler and create the JS bundles/source maps.
          const bundle = await devServer.legacySinglePageExportBundleAsync({
            platform,
            splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING && platform === 'web',
            mainModuleName: getEntryWithServerRoot(projectRoot, {
              platform,
              pkg: projectConfig.pkg,
            }),
            mode: dev ? 'development' : 'production',
            engine: isHermes ? 'hermes' : undefined,
            serializerIncludeMaps: sourceMaps,
            bytecode: bytecode && isHermes,
            clientBoundaries,
            reactCompiler: !!exp.experiments?.reactCompiler,
          });

          const moduleIdToSplitBundle = (
            bundle.artifacts
              .map(
                (artifact) => artifact?.metadata?.paths && Object.values(artifact.metadata.paths)
              )
              .filter(Boolean)
              .flat() as Record<string, string>[]
          ).reduce((acc, paths) => ({ ...acc, ...paths }), {});

          console.log('SSR Manifest:', moduleIdToSplitBundle);

          // Save the SSR manifest so we can perform more replacements in the server bundle.
          // files.set(`_expo/rsc/${platform}/ssr-manifest.json`, {
          //   targetDomain: 'server',
          //   contents: JSON.stringify(moduleIdToSplitBundle),
          // });

          // Persist rsc and update with split client chunks.
          await devServer.rscRenderer!.updateFlightModulesWithExportedClientBoundaries(
            payloads,
            moduleIdToSplitBundle,
            files
          );

          bundles[platform] = bundle;

          getFilesFromSerialAssets(bundle.artifacts, {
            includeSourceMaps: sourceMaps,
            files,
          });

          if (platform === 'web') {
            // TODO: Unify with exportStaticAsync
            // TODO: Maybe move to the serializer.
            let html = await serializeHtmlWithAssets({
              isExporting: true,
              resources: bundle.artifacts,
              template: await createTemplateHtmlFromExpoConfigAsync(projectRoot, {
                scripts: [],
                cssLinks: [],
                exp: projectConfig.exp,
              }),
              baseUrl,
            });

            // Add the favicon assets to the HTML.
            const modifyHtml = await getVirtualFaviconAssetsAsync(projectRoot, {
              outputDir,
              baseUrl,
              files,
              exp: projectConfig.exp,
            });
            if (modifyHtml) {
              html = modifyHtml(html);
            }

            // Generate SPA-styled HTML file.
            // If web exists, then write the template HTML file.
            files.set('index.html', {
              contents: html,
              targetDomain: 'client',
            });
          }
        })
      );

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
      metadata = createMetadataJson({
        bundles,
        fileNames,
        embeddedHashSet,
      });
      files.set('metadata.json', { contents: JSON.stringify(metadata) });
    }

    // HACK: Include platform-specific API Routes for _flight redirects.
    const { serverManifest } = await devServer.getServerManifestAsync();

    const apiRoutes = await exportApiRoutesAsync({
      // outputDir,
      server: devServer,
      manifest: serverManifest,
      // NOTE(kitten): For now, we always output source maps for API route exports
      includeSourceMaps: true,
      platform: platforms[0],
    });

    // Add the api routes to the files to export.
    for (const [route, contents] of apiRoutes) {
      files.set(route, contents);
    }
  } finally {
    await devServerManager.stopAsync();
  }

  return { files, metadata };
}
