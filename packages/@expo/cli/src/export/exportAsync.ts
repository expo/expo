import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { assertFolderEmptyAsync } from '../utils/assertFolderEmpty';
import { exportAppAsync } from './bundle/exportAppAsync';
import { mergeAsync } from './mergeAsync';
import { Options } from './resolveOptions';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);
  await fs.promises.mkdir(outputPath, { recursive: true });

  await assertFolderEmptyAsync({
    projectRoot: outputPath,
    folderName: options.outputDir,
    // Always overwrite files, this is inline with most bundler tooling.
    overwrite: true,
  });

  await exportAppAsync(projectRoot, options);

  await mergeAsync(projectRoot, options);

  // Final notes
  Log.log(`Export was successful. Your exported files can be found in ${options.outputDir}`);
}
