import { getConfig } from '@expo/config';
import fs from 'fs';
import Server from 'metro/src/Server';
import output from 'metro/src/shared/output/bundle';
import type { BundleOptions } from 'metro/src/shared/types';
import path from 'path';

import { Options } from './resolveOptions';
import { Log } from '../../log';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import {
  getBaseUrlFromExpoConfig,
  getMetroDirectBundleOptions,
} from '../../start/server/middleware/metroOptions';
import { removeAsync } from '../../utils/dir';
import { setNodeEnv } from '../../utils/nodeEnv';
import { profile } from '../../utils/profile';
import { isEnableHermesManaged } from '../exportHermes';
import { getAssets } from '../fork-bundleAsync';
import { persistMetroAssetsAsync } from '../persistMetroAssets';

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  // Ensure we delete the old bundle to trigger a failure if the bundle cannot be created.
  await removeAsync(options.bundleOutput);

  const { bundle, assets } = await exportEmbedBundleAsync(projectRoot, options);

  fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

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

export async function exportEmbedBundleAsync(projectRoot: string, options: Options) {
  const exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;

  // TODO: This is slow ~40ms
  const { config } = await loadMetroConfigAsync(
    projectRoot,
    {
      maxWorkers: options.maxWorkers,
      resetCache: options.resetCache,
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
    ...getMetroDirectBundleOptions({
      mainModuleName: options.entryFile,
      platform: options.platform,
      minify: options.minify,
      mode: options.dev ? 'development' : 'production',
      engine: isHermes ? 'hermes' : undefined,
      baseUrl: getBaseUrlFromExpoConfig(exp),
    }),
    sourceMapUrl,
    unstable_transformProfile: (options.unstableTransformProfile ||
      (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
  };

  const server = new Server(config, {
    watch: false,
  });

  try {
    const bundle = await profile(
      server.build.bind(server),
      'metro-bundle'
    )({
      ...bundleRequest,
      bundleType: 'bundle',
    });

    // Save the assets of the bundle
    const outputAssets = await getAssets(server, {
      ...bundleRequest,
      bundleType: 'todo',
    });

    return {
      bundle,
      assets: outputAssets,
    };
  } catch (error: any) {
    // Log using Xcode error format so the errors are picked up by xcodebuild.
    // https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script
    if (options.platform === 'ios') {
      console.error('error: ' + error.message);
    }
    throw error;
  } finally {
    server.end();
  }
}
