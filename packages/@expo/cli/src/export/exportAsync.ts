import chalk from 'chalk';
import path from 'path';

import { exportAppAsync } from './exportApp';
import { Options } from './resolveOptions';
import * as Log from '../log';
import { waitUntilAtlasExportIsReadyAsync } from '../start/server/metro/debugging/attachAtlas';
import { FileNotifier } from '../utils/FileNotifier';
import { ensureDirectoryAsync, removeAsync } from '../utils/dir';
import { ensureProcessExitsAfterDelay } from '../utils/exit';
import { CommandError } from '../utils/errors';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);

  if (outputPath === projectRoot) {
    throw new CommandError('--output-dir cannot be the same as the project directory.');
  } else if (path.relative(projectRoot, outputPath).startsWith('..')) {
    throw new CommandError(
      '--output-dir must be a subdirectory of the project directory. Generating outside of the project directory is not supported.'
    );
  }

  // Delete the output directory if it exists
  await removeAsync(outputPath);
  // Create the output directory
  await ensureDirectoryAsync(outputPath);

  // Export the app
  await exportAppAsync(projectRoot, options);

  // Stop any file watchers to prevent the CLI from hanging.
  FileNotifier.stopAll();
  // Wait until Atlas is ready, when enabled
  // NOTE(cedric): this is a workaround, remove when `process.exit` is removed
  await waitUntilAtlasExportIsReadyAsync(projectRoot);

  // Final notes
  Log.log(chalk.greenBright`Exported: ${options.outputDir}`);

  // Exit the process to stop any hanging processes from reading the app.config.js or server rendering.
  ensureProcessExitsAfterDelay();
}
