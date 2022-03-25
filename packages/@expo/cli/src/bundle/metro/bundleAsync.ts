import { resolveEntryPoint } from '@expo/config/paths';
import { EXPO_DEBUG } from '@expo/metro-config';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import * as Log from '../../log';
import { getMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { importCliPluginMetroFromProject } from '../../start/server/metro/resolveFromProject';
import { assertFolderEmptyAsync } from '../../utils/clearDirectory';

type Options = {
  clear?: boolean;
  minify?: boolean;
  sourcemapUseAbsolutePath?: boolean;
  sourcemapSourcesRoot?: string;
  bundleEncoding?: string;
  bundleOutput?: string;
  sourcemapOutput?: string;
  assetsDest?: string;
  maxWorkers?: number;
  dev?: boolean;
  platform: 'ios' | 'android';
  entryFile?: string;
};

function parseOptions(projectRoot: string, options: Partial<Options>): Options {
  const outputDir = options.bundleOutput
    ? path.dirname(options.bundleOutput)
    : // Create a default build folder `ios-build`, `android-build`, to match `web-build`.
      path.join(projectRoot, `${options.platform}-build`);

  assert(options.platform, '--platform must be provided');
  assert(['ios', 'android'].includes(options.platform), '--platform must be one of <android|ios>');
  if (options.maxWorkers != null) {
    assert(options.maxWorkers > 0, '--max-workers must be greater than zero');
  }

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
    clear: options.clear,
    minify: options.minify ?? !(options.dev === true),
    // Use Expo's entry point resolution to ensure all commands act the same way.
    entryFile: options.entryFile,
    sourcemapUseAbsolutePath: options.sourcemapUseAbsolutePath,
    sourcemapSourcesRoot: options.sourcemapSourcesRoot,
    bundleEncoding: options.bundleEncoding,
    bundleOutput: options.bundleOutput || path.join(outputDir, defaultBundleName),
    sourcemapOutput: options.sourcemapOutput || path.join(outputDir, defaultBundleName + '.map'),
    assetsDest: options.assetsDest,
    maxWorkers: options.maxWorkers,
    dev: options.dev,
    platform: options.platform,
  };
}

export async function bundleAsync(projectRoot: string, args: Partial<Options>) {
  Log.warn('expo bundle is experimental and subject to breaking changes');
  const options = parseOptions(projectRoot, args);

  // const config = getConfig(projectRoot, { skipSDKVersionRequirement: true });

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

  const { buildBundleWithConfig } = importCliPluginMetroFromProject(this.projectRoot);

  const loaded = await getMetroConfigAsync(projectRoot, options);

  await buildBundleWithConfig(
    {
      resetGlobalCache: false,
      resetCache: options.clear,
      entryFile: options.entryFile,
      sourcemapUseAbsolutePath: options.sourcemapUseAbsolutePath,
      sourcemapSourcesRoot: options.sourcemapSourcesRoot,
      bundleEncoding: options.bundleEncoding,
      bundleOutput: options.bundleOutput,
      sourcemapOutput: options.sourcemapOutput,
      assetsDest: options.assetsDest,
      verbose: EXPO_DEBUG,
      minify: options.minify,
      maxWorkers: options.maxWorkers,
      dev: options.dev,
      platform: options.platform,
    },
    loaded.config,
    require('metro/src/shared/output/bundle')
  );
}
