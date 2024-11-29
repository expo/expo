import { resolveEntryPoint } from '@expo/config/paths';
import arg from 'arg';
import type { OutputOptions } from 'metro/src/shared/types';
import canonicalize from 'metro-core/src/canonicalize';
import os from 'os';
import path from 'path';

import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { resolveCustomBooleanArgsAsync } from '../../utils/resolveArgs';
import { isAndroidUsingHermes, isIosUsingHermes } from '../exportHermes';

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
  bundleEncoding?: OutputOptions['bundleEncoding'];
  maxWorkers?: number;
  sourcemapOutput?: string;
  sourcemapSourcesRoot?: string;
  sourcemapUseAbsolutePath: boolean;
  verbose: boolean;
  unstableTransformProfile?: string;
  eager?: boolean;
}

function assertIsBoolean(val: any): asserts val is boolean {
  if (typeof val !== 'boolean') {
    throw new CommandError(`Expected boolean, got ${typeof val}`);
  }
}

function getBundleEncoding(encoding: string | undefined): OutputOptions['bundleEncoding'] {
  return encoding === 'utf8' || encoding === 'utf16le' || encoding === 'ascii'
    ? encoding
    : undefined;
}

export function resolveOptions(
  projectRoot: string,
  args: arg.Result<arg.Spec>,
  parsed: Awaited<ReturnType<typeof resolveCustomBooleanArgsAsync>>
): Options {
  const dev = parsed.args['--dev'] ?? true;
  assertIsBoolean(dev);

  const platform = args['--platform'];
  if (!platform) {
    throw new CommandError(`Missing required argument: --platform`);
  }

  const bundleOutput = args['--bundle-output'];

  const commonOptions = {
    entryFile: args['--entry-file'] ?? resolveEntryPoint(projectRoot, { platform }),
    assetCatalogDest: args['--asset-catalog-dest'],
    platform,
    transformer: args['--transformer'],
    // TODO: Support `--dev false`
    //   dev: false,
    bundleOutput,
    bundleEncoding: getBundleEncoding(args['--bundle-encoding']) ?? 'utf8',
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
    minify: parsed.args['--minify'] as boolean | undefined,
    eager: !!parsed.args['--eager'],
  };

  if (commonOptions.eager) {
    return resolveEagerOptionsAsync(projectRoot, commonOptions);
  }

  // Perform extra assertions after the eager options are resolved.

  if (!bundleOutput) {
    throw new CommandError(`Missing required argument: --bundle-output`);
  }

  const minify = parsed.args['--minify'] ?? !dev;
  assertIsBoolean(minify);

  return { ...commonOptions, minify, bundleOutput };
}

function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

/** Best effort guess of which options will be used for the export:embed invocation that is called from the native build scripts. */
export function resolveEagerOptionsAsync(
  projectRoot: string,
  {
    dev,
    platform,
    assetsDest,
    bundleOutput,
    minify,
    ...options
  }: Partial<Omit<Options, 'platform' | 'dev'>> & {
    platform: string;
    dev: boolean;
  }
): Options {
  // If the minify prop is undefined, then check if the project is using hermes.
  minify ??= !(platform === 'android'
    ? isAndroidUsingHermes(projectRoot)
    : isIosUsingHermes(projectRoot));

  let destination: string | undefined;

  if (!assetsDest) {
    destination ??= getTemporaryPath();
    assetsDest = path.join(destination, 'assets');
  }

  if (!bundleOutput) {
    destination ??= getTemporaryPath();
    bundleOutput =
      platform === 'ios'
        ? path.join(destination, 'main.jsbundle')
        : path.join(destination, 'index.js');
  }

  return {
    ...options,
    eager: options.eager ?? true,
    bundleOutput,
    assetsDest,
    entryFile: options.entryFile ?? resolveEntryPoint(projectRoot, { platform }),
    resetCache: !!options.resetCache,
    platform,
    minify,
    dev,
    bundleEncoding: 'utf8',
    sourcemapUseAbsolutePath: false,
    verbose: env.EXPO_DEBUG,
  };
}

export function getExportEmbedOptionsKey({
  // Extract all values that won't change the Metro results.
  resetCache,
  assetsDest,
  bundleOutput,
  verbose,
  maxWorkers,
  eager,
  ...options
}: Options) {
  // Create a sorted key for the options, removing values that won't change the Metro results.
  return JSON.stringify(options, canonicalize);
}

export function deserializeEagerKey(key: string) {
  return JSON.parse(key) as { options: Options; key: string };
}
