import chalk from 'chalk';

import logger from '../Logger';
import { CopyFileOptions, copyFileWithTransformsAsync } from '../Transforms';

/**
 * Copies vendored files from source directory to target directory
 * with transforms applied to their content and relative path.
 */
export async function copyVendoredFilesAsync(
  files: Set<string>,
  options: Omit<CopyFileOptions, 'sourceFile'>
): Promise<void> {
  for (const sourceFile of files) {
    const { targetFile } = await copyFileWithTransformsAsync({ sourceFile, ...options });

    if (sourceFile !== targetFile) {
      logger.log('📂 Renamed %s to %s', chalk.magenta(sourceFile), chalk.magenta(targetFile));
    }
  }
}
