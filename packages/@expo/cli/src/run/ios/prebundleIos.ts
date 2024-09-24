import path from 'path';

import { exportEmbedInternalAsync } from '../../export/embed/exportEmbedAsync';
import { Options } from '../../export/embed/resolveOptions';
import { env } from '../../utils/env';
import { AbortCommandError } from '../../utils/errors';

const canonicalize = require('metro-core/src/canonicalize');

// TODO: Disable minification if hermes is enabled
function isHermesEnabled(projectRoot: string) {
  // grep hermes-engine $PODS_PODFILE_DIR_PATH/Podfile.lock
  return true;
}

export async function prebundleAppAsync(
  projectRoot: string,
  {
    destination,
    bundleConfig,
    entryFile,
    dev,
    resetCache,
  }: {
    destination: string;
    entryFile: string;
    dev: boolean;
    bundleConfig?: string;
    resetCache?: boolean;
  }
) {
  const bundleFile = path.join(destination, 'main.jsbundle');

  const isHermes = isHermesEnabled(projectRoot);

  const options: Options = {
    entryFile,
    platform: 'ios',
    minify: !isHermes,
    dev,
    bundleEncoding: 'utf8',
    bundleOutput: bundleFile,
    assetsDest: destination,
    resetCache: !!resetCache,
    sourcemapUseAbsolutePath: false,
    // unstableTransformProfile: 'default',
    verbose: env.EXPO_DEBUG,
    config: bundleConfig,
  };

  try {
    await exportEmbedInternalAsync(projectRoot, options);
    // TODO: Compose source maps
  } catch (error: any) {
    // ctrl+c
    if (error.signal === 'SIGINT') {
      throw new AbortCommandError();
    }
    throw error;
  }

  return { destination, options, key: getExportEmbedKey(options) };
}

export function getExportEmbedKey(options: Options) {
  // Create a sorted key for the options, removing values that won't change the Metro results.
  return JSON.stringify(
    {
      ...options,
      resetCache: undefined,
      assetsDest: undefined,
      bundleOutput: undefined,
    },
    canonicalize
  );
}

export function deserializeInputKey(key: string) {
  return JSON.parse(key) as Awaited<ReturnType<typeof prebundleAppAsync>>;
}
