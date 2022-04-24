import path from 'path';

import * as Log from '../log';
import { ensureDirectoryAsync, removeAsync } from '../utils/dir';
import { exportAppAsync } from './bundle/exportAppAsync';
import { Options } from './resolveOptions';

export async function exportAsync(projectRoot: string, options: Options) {
  // Ensure the output directory is created
  const outputPath = path.resolve(projectRoot, options.outputDir);
  await removeAsync(outputPath);
  await ensureDirectoryAsync(outputPath);

  await exportAppAsync(projectRoot, options);

  // Final notes
  Log.log(`Export was successful. Your exported files can be found in ${options.outputDir}`);
}
