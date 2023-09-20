import fs from 'fs';
import Server from 'metro/src/Server';
import output from 'metro/src/shared/output/bundle';
import type { BundleOptions } from 'metro/src/shared/types';
import path from 'path';

import { Options } from './resolveOptions';
import { Log } from '../../log';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { importCliSaveAssetsFromProject } from '../../start/server/metro/resolveFromProject';
import { setNodeEnv } from '../../utils/nodeEnv';
import { getAssets } from '../fork-bundleAsync';

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const { config } = await loadMetroConfigAsync(
    projectRoot,
    {
      maxWorkers: options.maxWorkers,
      resetCache: options.resetCache,
      config: options.config,
    },
    {
      isExporting: true,
    }
  );

  // NOTE(EvanBacon): This may need to be adjusted in the future if want to support basePath on native
  // platforms when doing production embeds (unlikely).
  const saveAssets = importCliSaveAssetsFromProject(projectRoot);

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
    unstable_transformProfile:
      options.unstableTransformProfile as BundleOptions['unstable_transformProfile'],
  };

  const server = new Server(config, {
    watch: false,
  });

  try {
    const bundle = await server.build({
      ...bundleRequest,
      bundleType: 'bundle',
    });

    fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

    // Persist bundle and source maps.
    await output.save(bundle, options, Log.log);

    // Save the assets of the bundle
    const outputAssets = await getAssets(server, {
      ...bundleRequest,
      bundleType: 'todo',
    });

    await saveAssets(outputAssets, options.platform, options.assetsDest, options.assetCatalogDest);
  } finally {
    server.end();
  }
}
