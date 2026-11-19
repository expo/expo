import chalk from 'chalk';
import path from 'path';

import * as Log from '../log';
import { waitUntilAtlasExportIsReadyAsync } from '../start/server/metro/debugging/attachAtlas';
import { FileNotifier } from '../utils/FileNotifier';
import { ensureDirectoryAsync, removeAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { ensureProcessExitsAfterDelay } from '../utils/exit';
import { reportProgramResult, withProgramStatus } from '../utils/programStatus';
import { exportAppAsync } from './exportApp';
import type { Options } from './resolveOptions';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);

  if (outputPath === projectRoot) {
    throw new CommandError('--output-dir cannot be the same as the project directory.');
  } else if (projectRoot.startsWith(outputPath)) {
    throw new CommandError(`--output-dir cannot be a parent directory of the project directory.`);
  }
  // Delete the output directory if it exists
  await removeAsync(outputPath);
  // Create the output directory
  await ensureDirectoryAsync(outputPath);

  // Export the app
  await withProgramStatus({ state: 'working', msg: 'Exporting app' }, () =>
    exportAppAsync(projectRoot, options)
  );

  // Stop any file watchers to prevent the CLI from hanging.
  FileNotifier.stopAll();
  // Wait until Atlas is ready, when enabled
  // NOTE(cedric): this is a workaround, remove when `process.exit` is removed
  await waitUntilAtlasExportIsReadyAsync(projectRoot);

  // Final notes
  reportProgramResult({ state: 'done', msg: `Exported: ${options.outputDir}` });
  Log.log(chalk.greenBright`Exported: ${options.outputDir}`);

  // Exit the process to stop any hanging processes from reading the app.config.js or server rendering.
  ensureProcessExitsAfterDelay();
}
