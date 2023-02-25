import arg from 'arg';
import { env } from '../utils/env';
import { CommandError } from '../utils/errors';
import { resolveCustomBooleanArgsAsync } from '../utils/resolveArgs';
import path from 'path';
export interface Options {
  assetsDest?: string;
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
  generateStaticViewConfigs: boolean;
}

function isBool(val: any): asserts val is boolean {
  if (typeof val !== 'boolean') {
    throw new CommandError(`Expected boolean, got ${typeof val}`);
  }
}

export function resolveOptions(
  args: arg.Result<arg.Spec>,
  parsed: Awaited<ReturnType<typeof resolveCustomBooleanArgsAsync>>
): Options {
  const dev = parsed.args['--dev'] ?? true;
  isBool(dev);

  const generateStaticViewConfigs = parsed.args['--generate-static-view-configs'] ?? true;
  isBool(generateStaticViewConfigs);

  const minify = parsed.args['--minify'] ?? true;
  isBool(minify);

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
    verbose: env.EXPO_DEBUG,
    config: args['--config'] ? path.resolve(args['--config']) : undefined,
    dev,
    generateStaticViewConfigs,
    minify,
  };
}
