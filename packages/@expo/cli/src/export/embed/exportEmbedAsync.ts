import { getConfig } from '@expo/config';
import saveAssets from '@react-native-community/cli-plugin-metro/build/commands/bundle/saveAssets';
import fs from 'fs';
import Server from 'metro/src/Server';
import output from 'metro/src/shared/output/bundle';
import type { BundleOptions } from 'metro/src/shared/types';
import path from 'path';

import { Options } from './resolveOptions';
import { Log } from '../../log';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { env } from '../../utils/env';
import { setNodeEnv } from '../../utils/nodeEnv';
import { profile } from '../../utils/profile';
import { isEnableHermesManaged } from '../exportHermes';
import { getAssets } from '../fork-bundleAsync';

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const { bundle, assets } = await exportEmbedBundleAsync(projectRoot, options);

  fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

  // Persist bundle and source maps.
  await Promise.all([
    output.save(bundle, options, Log.log),
    // NOTE(EvanBacon): This may need to be adjusted in the future if want to support basePath on native
    // platforms when doing production embeds (unlikely).
    saveAssets(assets, options.platform, options.assetsDest, options.assetCatalogDest),
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
    entryFile: options.entryFile,
    sourceMapUrl,
    dev: options.dev,
    minify: !!options.minify,
    platform: options.platform,
    unstable_transformProfile: (options.unstableTransformProfile ||
      (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
    customTransformOptions: {
      __proto__: null,
      engine: isHermes ? 'hermes' : undefined,
      preserveEnvVars: env.EXPO_NO_CLIENT_ENV_VARS,
    },
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
  } finally {
    server.end();
  }
}
