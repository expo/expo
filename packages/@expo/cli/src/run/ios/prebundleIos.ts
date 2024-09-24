import fs from 'fs-extra';
import path from 'path';

import { exportEmbedAsync, exportEmbedInternalAsync } from '../../export/embed/exportEmbedAsync';
import { Log } from '../../log';
import { env } from '../../utils/env';
import { AbortCommandError } from '../../utils/errors';
import { Options } from '../../export/embed/resolveOptions';
const canonicalize = require('metro-core/src/canonicalize');

// TODO: Disable minification if hermes is enabled
function isHermesEnabled(projectRoot: string) {
  // grep hermes-engine $PODS_PODFILE_DIR_PATH/Podfile.lock
  return true;
}

/**
 * A JS implementation of `react-native/scripts/react-native-xcode.sh` which can be run before the native build for quicker results.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
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
  // if (process.env.BUNDLE_COMMAND) {
  //   Log.warn('Env BUNDLE_COMMAND is not supported in bundle-first mode');
  // }
  // if (process.env.CLI_PATH) {
  //   Log.warn('Env CLI_PATH is not supported in bundle-first mode');
  // }
  // if (process.env.NODE_ARGS) {
  //   Log.warn('Env NODE_ARGS is not supported in bundle-first mode');
  // }

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

async function copyDirAsync(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirAsync(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

export async function embedBundleAsync(bundlePath: string, binaryPath: string) {
  Log.debug('Copying JS into app binary folder: ' + binaryPath);
  // Move pre bundled app into binary
  await copyDirAsync(bundlePath, binaryPath);
  if (!env.EXPO_DEBUG) {
    try {
      // clean up
      await fs.remove(bundlePath);
    } catch (error: unknown) {
      Log.warn(`Failed to remove pre-bundled JS: ${error}`);
    }
  }
}
