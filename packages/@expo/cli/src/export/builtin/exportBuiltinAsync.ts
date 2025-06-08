import chalk from 'chalk';
import path from 'path';

import { exportAppAsync } from './../exportApp';
import { Options } from './resolveOptions';
import * as Log from '../../log';
import { waitUntilAtlasExportIsReadyAsync } from '../../start/server/metro/debugging/attachAtlas';
import { FileNotifier } from '../../utils/FileNotifier';
import { ensureDirectoryAsync, removeAsync } from '../../utils/dir';
import { CommandError } from '../../utils/errors';
import { ensureProcessExitsAfterDelay } from '../../utils/exit';
import { DevServerManager } from '../../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import assert from 'assert';
import resolveFrom from 'resolve-from';
import { ExportAssetMap, getFilesFromSerialAssets, persistMetroFilesAsync } from '../saveAssets';
import { setNodeEnv } from '../../utils/nodeEnv';

export async function exportBuiltinAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const outputPath = path.resolve(projectRoot, options.outputDir);

  // Delete the output directory if it exists
  await removeAsync(outputPath);
  // Create the output directory
  await ensureDirectoryAsync(outputPath);

  process.env.EXPO_USE_METRO_REQUIRE = '1';
  process.env.EXPO_BUNDLE_BUILT_IN = '1';
  process.env.EXPO_NO_CLIENT_ENV_VARS = '1';
  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, {
    minify: options.minify,
    mode: options.dev ? 'development' : 'production',
    port: 8081,
    isExporting: true,
    location: {},
    resetDevServer: options.clear,
    maxWorkers: options.maxWorkers,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  // TODO: Resolve using same package exports as metro for the given platform.
  // const pkgEntry = resolveFrom(projectRoot, options.pkg);
  // const pkgPkgJsonEntry = require(resolveFrom(projectRoot, `${options.pkg}/package.json`));

  // console.log('Exporting builtin', options.pkg, pkgPkgJsonEntry.version, pkgEntry);

  const files: ExportAssetMap = new Map();

  for (const platform of options.platforms) {
    const res = await devServer.exportBuiltinBundleAsync({
      platform,
      // bytecode: false,
      // minify: false,

      bytecode: true,
      minify: true,
      mainModuleName: path.join(projectRoot, options.pkg),
      // inlineSourceMap: true,
      serializerIncludeMaps: options.sourceMaps,
      mode: options.dev ? 'development' : 'production',
      reactCompiler: false,
      engine: 'hermes',

      //   minify: options.minify,
    });

    getFilesFromSerialAssets(res.artifacts, {
      includeSourceMaps: options.sourceMaps,
      files,
      isServerHosted: devServer.isReactServerComponentsEnabled,
    });

    // TODO: Wrap modules with `if (__DEV__) {}`
    console.log(res.artifacts);
  }

  await persistMetroFilesAsync(files, outputPath);

  // // Ensure the output directory is created
  // const outputPath = path.resolve(projectRoot, options.outputDir);

  // if (outputPath === projectRoot) {
  //   throw new CommandError('--output-dir cannot be the same as the project directory.');
  // } else if (path.relative(projectRoot, outputPath).startsWith('..')) {
  //   throw new CommandError(
  //     '--output-dir must be a subdirectory of the project directory. Generating outside of the project directory is not supported.'
  //   );
  // }

  // // Delete the output directory if it exists
  // await removeAsync(outputPath);
  // // Create the output directory
  // await ensureDirectoryAsync(outputPath);

  // // Export the app
  // await exportAppAsync(projectRoot, options);

  // // Stop any file watchers to prevent the CLI from hanging.
  // FileNotifier.stopAll();
  // // Wait until Atlas is ready, when enabled
  // // NOTE(cedric): this is a workaround, remove when `process.exit` is removed
  // await waitUntilAtlasExportIsReadyAsync(projectRoot);

  // // Final notes
  // Log.log(chalk.greenBright`Exported: ${options.outputDir}`);

  // // Exit the process to stop any hanging processes from reading the app.config.js or server rendering.
  ensureProcessExitsAfterDelay();
}
