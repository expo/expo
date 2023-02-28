import path from 'path';

import * as Log from '../log';
import { printExtraDependenciesAsync } from '../start/server/metro/withMetroMultiPlatform';
import { FileNotifier } from '../utils/FileNotifier';
import { ensureDirectoryAsync, removeAsync } from '../utils/dir';
import { exportAppAsync } from './exportApp';
import { Options } from './resolveOptions';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);
  // Delete the output directory if it exists
  await removeAsync(outputPath);
  // Create the output directory
  await ensureDirectoryAsync(outputPath);

  // Export the app
  await exportAppAsync(projectRoot, options);

  await printExtraDependenciesAsync(
    projectRoot,
    options.platforms.filter((p) => p !== 'web') as any
  );

  // Stop any file watchers to prevent the CLI from hanging.
  FileNotifier.stopAll();

  // Final notes
  Log.log(`Export was successful. Your exported files can be found in ${options.outputDir}`);
}
