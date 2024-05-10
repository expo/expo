import path from 'path';

import { exportAppAsync } from './exportApp';
import { Options } from './resolveOptions';
import * as Log from '../log';
import { FileNotifier } from '../utils/FileNotifier';
import { ensureDirectoryAsync, removeAsync } from '../utils/dir';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);
  // Delete the output directory if it exists
  await removeAsync(outputPath);
  // Create the output directory
  await ensureDirectoryAsync(outputPath);

  // Export the app
  await exportAppAsync(projectRoot, options);

  // Stop any file watchers to prevent the CLI from hanging.
  FileNotifier.stopAll();

  // Final notes
  Log.log(`App exported to: ${options.outputDir}`);

  // Exit the process to stop any hanging processes from reading the app.config.js or server rendering.
  process.exit(0);
}
