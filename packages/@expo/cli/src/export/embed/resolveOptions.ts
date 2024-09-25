import { resolveEntryPoint } from '@expo/config/paths';
import arg from 'arg';
import os from 'os';
import path from 'path';

import { isAndroidUsingHermesAsync, isIosUsingHermesAsync } from './guessHermes';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { resolveCustomBooleanArgsAsync } from '../../utils/resolveArgs';

const canonicalize = require('metro-core/src/canonicalize');

export interface Options {
  assetsDest?: string;
  assetCatalogDest?: string;
  entryFile: string;
  resetCache: boolean;
  transformer?: string;
  minify?: boolean;
  config?: string;
  platform: string;
  dev: boolean;
  bundleOutput: string;
  bundleEncoding?: string;
  maxWorkers?: number;
  sourcemapOutput?: string;
  sourcemapSourcesRoot?: string;
  sourcemapUseAbsolutePath: boolean;
  verbose: boolean;
  unstableTransformProfile?: string;
}

function assertIsBoolean(val: any): asserts val is boolean {
  if (typeof val !== 'boolean') {
    throw new CommandError(`Expected boolean, got ${typeof val}`);
  }
}

export function resolveOptions(
  args: arg.Result<arg.Spec>,
  parsed: Awaited<ReturnType<typeof resolveCustomBooleanArgsAsync>>
): Options {
  const dev = parsed.args['--dev'] ?? true;
  assertIsBoolean(dev);

  const minify = parsed.args['--minify'] ?? !dev;
  assertIsBoolean(minify);

  const entryFile = args['--entry-file'];
  if (!entryFile) {
    throw new CommandError(`Missing required argument: --entry-file`);
  }
  const bundleOutput = args['--bundle-output'];
  if (!bundleOutput) {
    throw new CommandError(`Missing required argument: --bundle-output`);
  }
  return {
    entryFile,
    assetCatalogDest: args['--asset-catalog-dest'],
    platform: args['--platform'] ?? 'ios',
    transformer: args['--transformer'],
    // TODO: Support `--dev false`
    //   dev: false,
    bundleOutput,
    bundleEncoding: args['--bundle-encoding'] ?? 'utf8',
    maxWorkers: args['--max-workers'],
    sourcemapOutput: args['--sourcemap-output'],
    sourcemapSourcesRoot: args['--sourcemap-sources-root'],
    sourcemapUseAbsolutePath: !!parsed.args['--sourcemap-use-absolute-path'],
    assetsDest: args['--assets-dest'],
    unstableTransformProfile: args['--unstable-transform-profile'],
    resetCache: !!parsed.args['--reset-cache'],
    verbose: args['--verbose'] ?? env.EXPO_DEBUG,
    config: args['--config'] ? path.resolve(args['--config']) : undefined,
    dev,
    minify,
  };
}

function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

/** Best effort guess of which options will be used for the export:embed invocation that is called from the native build scripts. */
export async function resolveEagerOptionsAsync(
  projectRoot: string,
  {
    destination,
    bundleConfig,
    entryFile,
    dev,
    resetCache,
    platform,
  }: {
    platform: string;
    dev: boolean;
    destination?: string;
    entryFile?: string;
    bundleConfig?: string;
    resetCache?: boolean;
  }
): Promise<Options> {
  destination ??= getTemporaryPath();
  entryFile ??= resolveEntryPoint(projectRoot, { platform: 'ios' });

  const isHermes =
    platform === 'android'
      ? await isAndroidUsingHermesAsync(projectRoot)
      : await isIosUsingHermesAsync(projectRoot);

  const bundleFile =
    platform === 'ios'
      ? path.join(destination, 'main.jsbundle')
      : path.join(destination, 'index.js');

  return {
    entryFile,
    platform,
    minify: !isHermes,
    dev,
    bundleEncoding: 'utf8',
    bundleOutput: bundleFile,
    assetsDest: path.join(destination, 'assets'),
    resetCache: !!resetCache,
    sourcemapUseAbsolutePath: false,
    verbose: env.EXPO_DEBUG,
    config: bundleConfig,
  };
}

export function getExportEmbedOptionsKey({
  // Extract all values that won't change the Metro results.
  resetCache,
  assetsDest,
  bundleOutput,
  verbose,
  maxWorkers,
  ...options
}: Options) {
  // Create a sorted key for the options, removing values that won't change the Metro results.
  return JSON.stringify(options, canonicalize);
}

export function deserializeEagerKey(key: string) {
  return JSON.parse(key) as { options: Options; key: string };
}
