import { getConfig } from '@expo/config';
import { resolveEntryPoint } from '@expo/config/paths';
import { bundleAsync, BundleOptions, MetroDevServerOptions } from '@expo/dev-server';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
// import { printBundleSizes, ProjectUtils } from 'xdl';

import * as Log from '../log';
import { assertFolderEmptyAsync } from '../utils/clearDirectory';

type Options = {
  clear?: boolean;
  bundleOutput?: string;
  sourcemapOutput?: string;
  assetsOutput?: string;
  maxWorkers?: number;
  dev?: boolean;
  platform: 'ios' | 'android';
  entryFile?: string;
};

function parseOptions(options: Partial<Options>): Options {
  assert(options.platform, '--platform must be provided');
  assert(['ios', 'android'].includes(options.platform), '--platform must be one of [android|ios]');
  if (options.maxWorkers != null) {
    assert(options.maxWorkers > 0, '--max-workers must be greater than zero');
  }

  return {
    clear: options.clear,
    entryFile: options.entryFile,
    bundleOutput: options.bundleOutput,
    sourcemapOutput: options.sourcemapOutput,
    assetsOutput: options.assetsOutput,
    maxWorkers: options.maxWorkers,
    dev: options.dev,
    platform: options.platform,
  };
}

function createDevServerOptions(
  projectRoot: string,
  options: Pick<Options, 'clear'>
): MetroDevServerOptions {
  return {
    resetCache: options.clear,
    logger: ProjectUtils.getLogger(projectRoot),
  };
}

function createPlatformBundleOptions(
  projectRoot: string,
  outputDir: string,
  options: Pick<
    Options,
    'platform' | 'dev' | 'sourcemapOutput' | 'bundleOutput' | 'assetsOutput' | 'entryFile'
  >
): BundleOptions {
  // Create a default bundle name
  const defaultBundleName = options.platform === 'ios' ? 'index.jsbundle' : 'index.android.bundle';

  if (!options.entryFile) {
    const entryFile = resolveEntryPoint(projectRoot, { platform: options.platform });
    assert(
      entryFile,
      `The project entry file could not be resolved. Please either define it in the \`package.json\` (main), \`app.json\` (expo.entryPoint), create an \`index.js\`, or install the \`expo\` package.`
    );
    options.entryFile = entryFile;
  }

  return {
    bundleOutput: options.bundleOutput || path.join(outputDir, defaultBundleName),
    assetOutput: options.assetsOutput || outputDir,
    platform: options.platform,
    // Use Expo's entry point resolution to ensure all commands act the same way.
    entryPoint: options.entryFile,
    sourcemapOutput: options.sourcemapOutput || path.join(outputDir, defaultBundleName + '.map'),
    // This prevents the absolute path from being shown in the source code, shouts out to Satya.
    sourcemapSourcesRoot: projectRoot,
    // For now, just use dev for both dev and minify
    dev: !!options.dev,
    minify: !options.dev,
  };
}

export async function bundleAsync(projectRoot: string, args: Partial<Options>) {
  Log.warn('expo bundle is experimental and subject to breaking changes');
  const options = parseOptions(args);

  const config = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const outputDir = options.bundleOutput
    ? path.dirname(options.bundleOutput)
    : // Create a default build folder `ios-build`, `android-build`, to match `web-build`.
      path.join(projectRoot, `${options.platform}-build`);

  // Ensure the output directory is created
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Clear out the folder
  await assertFolderEmptyAsync({
    projectRoot: outputDir,
    folderName: path.relative(projectRoot, outputDir),
    // Always overwrite files, this is inline with most bundler tooling.
    overwrite: true,
  });

  const [results] = await bundleAsync(
    projectRoot,
    config.exp,
    createDevServerOptions(projectRoot, options),
    [createPlatformBundleOptions(projectRoot, outputDir, options)]
  );

  // Pretty print the resulting sizes
  //   printBundleSizes({ [options.platform]: results });
}
