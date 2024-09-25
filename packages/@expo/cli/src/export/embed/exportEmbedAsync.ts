/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, getConfig } from '@expo/config';
import getMetroAssets from '@expo/metro-config/build/transform-worker/getAssets';
import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import { sync as globSync } from 'glob';
import Server from 'metro/src/Server';
import splitBundleOptions from 'metro/src/lib/splitBundleOptions';
import output from 'metro/src/shared/output/bundle';
import type { BundleOptions } from 'metro/src/shared/types';
import path from 'path';
import resolveFrom from 'resolve-from';

import { deserializeEagerKey, getExportEmbedOptionsKey, Options } from './resolveOptions';
import { isExecutingFromXcodebuild, logMetroErrorInXcode } from './xcodeCompilerLogger';
import { Log } from '../../log';
import { DevServerManager } from '../../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { assertMetroPrivateServer } from '../../start/server/metro/metroPrivateServer';
import { serializeHtmlWithAssets } from '../../start/server/metro/serializeHtml';
import {
  getDomComponentHtml,
  DOM_COMPONENTS_BUNDLE_DIR,
} from '../../start/server/middleware/DomComponentsMiddleware';
import { getMetroDirectBundleOptionsForExpoConfig } from '../../start/server/middleware/metroOptions';
import { stripAnsi } from '../../utils/ansi';
import { copyAsync, removeAsync } from '../../utils/dir';
import { env } from '../../utils/env';
import { setNodeEnv } from '../../utils/nodeEnv';
import { isEnableHermesManaged } from '../exportHermes';
import { exportApiRoutesStandaloneAsync } from '../exportStaticAsync';
import { persistMetroAssetsAsync } from '../persistMetroAssets';
import { copyPublicFolderAsync } from '../publicFolder';
import {
  BundleAssetWithFileHashes,
  ExportAssetMap,
  getFilesFromSerialAssets,
  persistMetroFilesAsync,
} from '../saveAssets';

const debug = require('debug')('expo:export:embed');

function guessCopiedAppleBundlePath(bundleOutput: string) {
  // Ensure the path is familiar before guessing.
  if (!bundleOutput.match(/\/Xcode\/DerivedData\/.*\/Build\/Products\//)) {
    debug('Bundling to non-standard location:', bundleOutput);
    return false;
  }
  const bundleName = path.basename(bundleOutput);
  const bundleParent = path.dirname(bundleOutput);
  const possiblePath = globSync(path.join(bundleParent, `*.app/${bundleName}`), {
    // bundle identifiers can start with dots.
    dot: true,
  })[0];
  debug('Possible path for previous bundle:', possiblePath);
  return possiblePath;
}

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  // The React Native build scripts always enable the cache reset but we shouldn't need this in CI environments.
  // By disabling it, we can eagerly bundle code before the build and reuse the cached artifacts in subsequent builds.
  if (env.CI && options.resetCache) {
    debug('CI environment detected, disabling automatic cache reset');
    options.resetCache = false;
  }

  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  // This is an optimized codepath that can occur during `npx expo run` and does not occur during builds from Xcode or Android Studio.
  // Here we reconcile a bundle pass that was run before the native build process. This order can fail faster and is show better errors since the logs won't be obscured by Xcode and Android Studio.
  // This path is also used for automatically deploying server bundles to a remote host.
  const eagerBundleOptions = env.__EXPO_EAGER_BUNDLE_OPTIONS
    ? deserializeEagerKey(env.__EXPO_EAGER_BUNDLE_OPTIONS)
    : null;
  if (eagerBundleOptions) {
    // Get the cache key for the current process to compare against the eager key.
    const inputKey = getExportEmbedOptionsKey(options);

    // If the app was bundled previously in the same process, then we should reuse the Metro cache.
    options.resetCache = false;

    if (eagerBundleOptions.key === inputKey) {
      // Copy the eager bundleOutput and assets to the new locations.
      await removeAsync(options.bundleOutput);

      copyAsync(eagerBundleOptions.options.bundleOutput, options.bundleOutput);

      if (eagerBundleOptions.options.assetsDest && options.assetsDest) {
        copyAsync(eagerBundleOptions.options.assetsDest, options.assetsDest);
      }

      console.log('info: Copied output to binary:', options.bundleOutput);
      return;
    }
    // TODO: sourcemapOutput is set on Android but not during eager. This is tolerable since it doesn't invalidate the Metro cache.
    console.log('  Eager key:', eagerBundleOptions.key);
    console.log('Request key:', inputKey);

    // TODO: We may want an analytic event here in the future to understand when this happens.
    console.warn('warning: Eager bundle does not match new options, bundling again.');
  }

  return exportEmbedInternalAsync(projectRoot, options);
}

export async function exportEmbedInternalAsync(projectRoot: string, options: Options) {
  // Ensure we delete the old bundle to trigger a failure if the bundle cannot be created.
  await removeAsync(options.bundleOutput);

  // The iOS bundle is copied in to the Xcode project, so we need to remove the old one
  // to prevent Xcode from loading the old one after a build failure.
  if (options.platform === 'ios') {
    const previousPath = guessCopiedAppleBundlePath(options.bundleOutput);
    if (previousPath && fs.existsSync(previousPath)) {
      debug('Removing previous iOS bundle:', previousPath);
      await removeAsync(previousPath);
    }
  }

  const { bundle, assets, files } = await exportEmbedBundleAndAssetsAsync(projectRoot, options);

  fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

  // On Android, dom components proxy files should write to the assets directory instead of the res directory.
  // We use the bundleOutput directory to get the assets directory.
  const domComponentProxyOutputDir =
    options.platform === 'android' ? path.dirname(options.bundleOutput) : options.assetsDest;
  const hasDomComponents = domComponentProxyOutputDir && files.size > 0;

  // Persist bundle and source maps.
  await Promise.all([
    output.save(bundle, options, Log.log),

    // Write dom components proxy files.
    hasDomComponents ? persistMetroFilesAsync(files, domComponentProxyOutputDir) : null,
    // Copy public folder for dom components only if
    hasDomComponents
      ? copyPublicFolderAsync(
          path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER),
          path.join(domComponentProxyOutputDir, DOM_COMPONENTS_BUNDLE_DIR)
        )
      : null,

    // NOTE(EvanBacon): This may need to be adjusted in the future if want to support baseUrl on native
    // platforms when doing production embeds (unlikely).
    options.assetsDest
      ? persistMetroAssetsAsync(projectRoot, assets, {
          platform: options.platform,
          outputDirectory: options.assetsDest,
          iosAssetCatalogDirectory: options.assetCatalogDest,
        })
      : null,
  ]);
}

export async function exportEmbedBundleAndAssetsAsync(
  projectRoot: string,
  options: Options
): Promise<{
  bundle: Awaited<ReturnType<Server['build']>>;
  assets: readonly BundleAssetWithFileHashes[];
  files: ExportAssetMap;
}> {
  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, {
    minify: options.minify,
    mode: options.dev ? 'development' : 'production',
    port: 8081,
    isExporting: true,
    location: {},
    resetDevServer: options.resetCache,
    maxWorkers: options.maxWorkers,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;
  const isHermes = isEnableHermesManaged(exp, options.platform);

  let sourceMapUrl = options.sourcemapOutput;
  if (sourceMapUrl && !options.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const files: ExportAssetMap = new Map();

  try {
    const bundles = await devServer.nativeExportBundleAsync(
      {
        // TODO: Re-enable when we get bytecode chunk splitting working again.
        splitChunks: false, //devServer.isReactServerComponentsEnabled,
        mainModuleName: resolveRealEntryFilePath(projectRoot, options.entryFile),
        platform: options.platform,
        minify: options.minify,
        mode: options.dev ? 'development' : 'production',
        engine: isHermes ? 'hermes' : undefined,
        serializerIncludeMaps: !!sourceMapUrl,
        // Never output bytecode in the exported bundle since that is hardcoded in the native run script.
        bytecode: false,
        // source map inline
        reactCompiler: !!exp.experiments?.reactCompiler,
      },
      files,
      {
        sourceMapUrl,
        unstable_transformProfile: (options.unstableTransformProfile ||
          (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
      }
    );

    if (devServer.isReactServerComponentsEnabled) {
      // Export the API routes for server rendering the React Server Components.
      await exportApiRoutesStandaloneAsync(devServer, {
        files,
        platform: 'web',
      });

      // Store the server output in the project's .expo directory.
      const serverOutput = path.join(projectRoot, '.expo/server', options.platform);
      await removeAsync(serverOutput);
      await persistMetroFilesAsync(files, serverOutput);

      [...files.entries()].forEach(([key, value]) => {
        if (value.targetDomain === 'server') {
          // Delete server resources to prevent them from being exposed in the binary.
          files.delete(key);
        }
      });
    }

    // TODO: Remove duplicates...
    const expoDomComponentReferences = bundles.artifacts
      .map((artifact) =>
        Array.isArray(artifact.metadata.expoDomComponentReferences)
          ? artifact.metadata.expoDomComponentReferences
          : []
      )
      .flat();

    await exportDomComponentsAsync(
      projectRoot,
      expoDomComponentReferences,
      options,
      devServer,
      isHermes,
      sourceMapUrl,
      exp,
      files
    );

    return {
      files,
      bundle: {
        code: bundles.artifacts.filter((a: any) => a.type === 'js')[0].source.toString(),
        // Can be optional when source maps aren't enabled.
        map: bundles.artifacts.filter((a: any) => a.type === 'map')[0]?.source.toString(),
      },
      assets: bundles.assets,
    };
  } catch (error: any) {
    if (isError(error)) {
      // Log using Xcode error format so the errors are picked up by xcodebuild.
      // https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script
      if (options.platform === 'ios') {
        // If the error is about to be presented in Xcode, strip the ansi characters from the message.
        if ('message' in error && isExecutingFromXcodebuild()) {
          error.message = stripAnsi(error.message) as string;
        }
        logMetroErrorInXcode(projectRoot, error);
      }
    }
    throw error;
  } finally {
    devServerManager.stopAsync();
  }
}

// TODO(EvanBacon): Move this to expo export in the future when we determine how to support DOM Components with hosting.
async function exportDomComponentsAsync(
  projectRoot: string,
  expoDomComponentReferences: string[],
  options: Options,
  devServer: MetroBundlerDevServer,
  isHermes: boolean,
  sourceMapUrl: string | undefined,
  exp: ExpoConfig,
  files: ExportAssetMap
) {
  if (!expoDomComponentReferences.length) {
    return;
  }

  const virtualEntry = resolveFrom(projectRoot, 'expo/dom/entry.js');
  await Promise.all(
    // TODO: Make a version of this which uses `this.metro.getBundler().buildGraphForEntries([])` to bundle all the DOM components at once.
    expoDomComponentReferences.map(async (filePath) => {
      debug('Bundle DOM Component:', filePath);
      // MUST MATCH THE BABEL PLUGIN!
      const hash = crypto.createHash('sha1').update(filePath).digest('hex');
      const outputName = `${DOM_COMPONENTS_BUNDLE_DIR}/${hash}.html`;
      const generatedEntryPath = filePath.startsWith('file://') ? filePath.slice(7) : filePath;
      const baseUrl = `/${DOM_COMPONENTS_BUNDLE_DIR}`;
      const relativeImport = './' + path.relative(path.dirname(virtualEntry), generatedEntryPath);
      // Run metro bundler and create the JS bundles/source maps.
      const bundle = await devServer.legacySinglePageExportBundleAsync({
        platform: 'web',
        domRoot: encodeURI(relativeImport),
        splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING,
        mainModuleName: resolveRealEntryFilePath(projectRoot, virtualEntry),
        mode: options.dev ? 'development' : 'production',
        engine: isHermes ? 'hermes' : undefined,
        serializerIncludeMaps: !!sourceMapUrl,
        bytecode: false,
        reactCompiler: !!exp.experiments?.reactCompiler,
        baseUrl: './',
        // Minify may be false because it's skipped on native when Hermes is enabled, default to true.
        minify: true,
      });

      const html = await serializeHtmlWithAssets({
        isExporting: true,
        resources: bundle.artifacts,
        template: getDomComponentHtml(),
        baseUrl: './',
      });

      getFilesFromSerialAssets(
        bundle.artifacts.map((a) => {
          return {
            ...a,
            filename: path.join(baseUrl, a.filename),
          };
        }),
        {
          includeSourceMaps: !!sourceMapUrl,
          files,
          platform: 'web',
        }
      );

      files.set(outputName, {
        contents: html,
      });

      if (options.assetsDest) {
        // Save assets like a typical bundler, preserving the file paths on web.
        // This is saving web-style inside of a native app's binary.
        await persistMetroAssetsAsync(
          projectRoot,
          bundle.assets.map((asset) => ({
            ...asset,
            httpServerLocation: path.join(DOM_COMPONENTS_BUNDLE_DIR, asset.httpServerLocation),
          })),
          {
            files,
            platform: 'web',
            outputDirectory: options.assetsDest,
          }
        );
      }
    })
  );
}

// Exports for expo-updates
export async function createMetroServerAndBundleRequestAsync(
  projectRoot: string,
  options: Pick<
    Options,
    | 'maxWorkers'
    | 'config'
    | 'platform'
    | 'sourcemapOutput'
    | 'sourcemapUseAbsolutePath'
    | 'entryFile'
    | 'minify'
    | 'dev'
    | 'resetCache'
    | 'unstableTransformProfile'
  >
): Promise<{ server: Server; bundleRequest: BundleOptions }> {
  const exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;

  // TODO: This is slow ~40ms
  const { config } = await loadMetroConfigAsync(
    projectRoot,
    {
      // TODO: This is always enabled in the native script and there's no way to disable it.
      resetCache: options.resetCache,

      maxWorkers: options.maxWorkers,
      config: options.config,
    },
    {
      exp,
      isExporting: true,
      getMetroBundler() {
        return server.getBundler().getBundler();
      },
    }
  );

  const isHermes = isEnableHermesManaged(exp, options.platform);

  let sourceMapUrl = options.sourcemapOutput;
  if (sourceMapUrl && !options.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const bundleRequest = {
    ...Server.DEFAULT_BUNDLE_OPTIONS,
    ...getMetroDirectBundleOptionsForExpoConfig(projectRoot, exp, {
      splitChunks: false,
      mainModuleName: resolveRealEntryFilePath(projectRoot, options.entryFile),
      platform: options.platform,
      minify: options.minify,
      mode: options.dev ? 'development' : 'production',
      engine: isHermes ? 'hermes' : undefined,
      isExporting: true,
      // Never output bytecode in the exported bundle since that is hardcoded in the native run script.
      bytecode: false,
    }),
    sourceMapUrl,
    unstable_transformProfile: (options.unstableTransformProfile ||
      (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
  };

  const server = new Server(config, {
    watch: false,
  });

  return { server, bundleRequest };
}

export async function exportEmbedAssetsAsync(
  server: Server,
  bundleRequest: BundleOptions,
  projectRoot: string,
  options: Pick<Options, 'platform'>
) {
  try {
    const { entryFile, onProgress, resolverOptions, transformOptions } = splitBundleOptions({
      ...bundleRequest,
      bundleType: 'todo',
    });

    assertMetroPrivateServer(server);

    const dependencies = await server._bundler.getDependencies(
      [entryFile],
      transformOptions,
      resolverOptions,
      { onProgress, shallow: false, lazy: false }
    );

    const config = server._config;

    return getMetroAssets(dependencies, {
      processModuleFilter: config.serializer.processModuleFilter,
      assetPlugins: config.transformer.assetPlugins,
      platform: transformOptions.platform!,
      // Forked out of Metro because the `this._getServerRootDir()` doesn't match the development
      // behavior.
      projectRoot: config.projectRoot, // this._getServerRootDir(),
      publicPath: config.transformer.publicPath,
    });
  } catch (error: any) {
    if (isError(error)) {
      // Log using Xcode error format so the errors are picked up by xcodebuild.
      // https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script
      if (options.platform === 'ios') {
        // If the error is about to be presented in Xcode, strip the ansi characters from the message.
        if ('message' in error && isExecutingFromXcodebuild()) {
          error.message = stripAnsi(error.message) as string;
        }
        logMetroErrorInXcode(projectRoot, error);
      }
    }
    throw error;
  }
}

function isError(error: any): error is Error {
  return error instanceof Error;
}

/**
 * This is a workaround for Metro not resolving entry file paths to their real location.
 * When running exports through `eas build --local` on macOS, the `/var/folders` path is used instead of `/private/var/folders`.
 *
 * See: https://github.com/expo/expo/issues/28890
 */
function resolveRealEntryFilePath(projectRoot: string, entryFile: string): string {
  if (projectRoot.startsWith('/private/var') && entryFile.startsWith('/var')) {
    return fs.realpathSync(entryFile);
  }

  return entryFile;
}
