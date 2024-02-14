/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import { EmbeddedManifest } from 'expo-manifests';
import fs from 'fs';
import { sync as globSync } from 'glob';
import Server from 'metro/src/Server';
import output from 'metro/src/shared/output/bundle';
import crypto from 'crypto';
import path from 'path';
import resolveFrom from 'resolve-from';

import { Log } from '../../log';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { getMetroDirectBundleOptionsForExpoConfig } from '../../start/server/middleware/metroOptions';
import { stripAnsi } from '../../utils/ansi';
import { removeAsync } from '../../utils/dir';
import { setNodeEnv } from '../../utils/nodeEnv';
import { profile } from '../../utils/profile';
import { isEnableHermesManaged } from '../exportHermes';
import { getAssets } from '../fork-bundleAsync';
import { getAssetLocalPath } from '../metroAssetLocalPath';
import { filterPlatformAssetScales, persistMetroAssetsAsync } from '../persistMetroAssets';
import { Options } from './resolveOptions';
import { isExecutingFromXcodebuild, logMetroErrorInXcode } from './xcodeCompilerLogger';

import type { BundleOptions } from 'metro/src/shared/types';
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
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

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

  const { bundle, assets } = await exportEmbedBundleAndAssetsAsync(projectRoot, options);

  fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

  // TODO: Some system for detecting if we should export the manifest, this is low priority since
  // the assets are already calculated.
  // NOTE: iOS used to leverage the cocoapods setting `$expo_updates_create_manifest = false` to disable this.
  if (resolveFrom.silent(projectRoot, 'expo-updates')) {
    const manifest = getUpdatesManifest({ assets, platform: options.platform });

    if (options.platform === 'ios') {
      // TODO: Check this location.
      const outputDir = path.join(options.assetsDest!, 'EXUpdates.bundle', 'app.manifest');
      fs.mkdirSync(path.dirname(outputDir), { recursive: true, mode: 0o755 });
      fs.writeFileSync(JSON.stringify(manifest), outputDir);
    } else if (options.platform === 'android') {
      // TODO: Write the android manifest somewhere.
    }
  }

  // Persist bundle and source maps.
  await Promise.all([
    output.save(bundle, options, Log.log),
    // NOTE(EvanBacon): This may need to be adjusted in the future if want to support baseUrl on native
    // platforms when doing production embeds (unlikely).
    options.assetsDest
      ? persistMetroAssetsAsync(assets, {
          platform: options.platform,
          outputDirectory: options.assetsDest,
          iosAssetCatalogDirectory: options.assetCatalogDest,
        })
      : null,
  ]);
}

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
    | 'unstableTransformProfile'
  >
): Promise<{ server: Server; bundleRequest: BundleOptions }> {
  const exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;

  // TODO: This is slow ~40ms
  const { config } = await loadMetroConfigAsync(
    projectRoot,
    {
      maxWorkers: options.maxWorkers,
      resetCache: false, //options.resetCache,
      config: options.config,
    },
    {
      exp,
      isExporting: true,
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
      mainModuleName: options.entryFile,
      platform: options.platform,
      minify: options.minify,
      mode: options.dev ? 'development' : 'production',
      engine: isHermes ? 'hermes' : undefined,
      bytecode: isHermes,
      isExporting: true,
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

export function getUpdatesManifest({
  assets,
  platform,
}: {
  assets: Awaited<ReturnType<typeof getAssets>>;
  platform: string;
}): EmbeddedManifest {
  const manifest: EmbeddedManifest = {
    id: crypto.randomUUID(),
    commitTime: new Date().getTime(),
    assets: [],
  };

  assets.forEach(function (asset) {
    // TODO: We could possibly calculate this lazily.
    if (!asset.fileHashes) {
      throw new Error(
        'The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/main/packages/expo-updates/README.md#metroconfigjs for an example.'
      );
    }
    filterPlatformAssetScales(platform, asset.scales).forEach(function (scale, index) {
      const baseAssetInfoForManifest = {
        name: asset.name,
        type: asset.type,
        scale,
        packagerHash: asset.fileHashes[index],
        subdirectory: asset.httpServerLocation,
      };
      const assetPath = getAssetLocalPath(asset, { scale, platform });
      if (platform === 'ios') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          nsBundleDir: path.dirname(assetPath),
          nsBundleFilename: path.basename(assetPath, path.extname(assetPath)),
        });
      } else if (platform === 'android') {
        manifest.assets.push({
          ...baseAssetInfoForManifest,
          scales: asset.scales,
          resourcesFolder: path.dirname(assetPath),
          resourcesFilename: path.basename(assetPath, path.extname(assetPath)),
        });
      }
    });
  });

  return manifest;
}

export async function exportEmbedBundleAndAssetsAsync(
  projectRoot: string,
  options: Options
): Promise<{
  bundle: Awaited<ReturnType<Server['build']>>;
  assets: Awaited<ReturnType<typeof getAssets>>;
}> {
  const { server, bundleRequest } = await createMetroServerAndBundleRequestAsync(
    projectRoot,
    options
  );

  try {
    const bundle = await exportEmbedBundleAsync(server, bundleRequest, projectRoot, options);
    const assets = await exportEmbedAssetsAsync(server, bundleRequest, projectRoot, options);
    return { bundle, assets };
  } finally {
    server.end();
  }
}

export async function exportEmbedBundleAsync(
  server: Server,
  bundleRequest: BundleOptions,
  projectRoot: string,
  options: Pick<Options, 'platform'>
) {
  try {
    return await profile(
      server.build.bind(server),
      'metro-bundle'
    )({
      ...bundleRequest,
      bundleType: 'bundle',
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

export async function exportEmbedAssetsAsync(
  server: Server,
  bundleRequest: BundleOptions,
  projectRoot: string,
  options: Pick<Options, 'platform'>
) {
  try {
    return await getAssets(server, {
      ...bundleRequest,
      bundleType: 'todo',
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
