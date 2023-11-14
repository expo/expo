import arg from 'arg';
import path from 'path';

import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { resolveCustomBooleanArgsAsync } from '../../utils/resolveArgs';

export interface Options {
  assetsDest?: string;
  assetCatalogDest?: string;
  entryFile: string;
  resetCache: boolean;
  resetGlobalCache: boolean;
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
    resetGlobalCache: false,
    verbose: args['--verbose'] ?? env.EXPO_DEBUG,
    config: args['--config'] ? path.resolve(args['--config']) : undefined,
    dev,
    minify,
  };
}
