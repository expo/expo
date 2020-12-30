import chalk from 'chalk';

import logger from '../Logger';
import { CopyFilesOptions, copyFilesWithTransformsAsync } from '../utils/copyFilesWithTransforms';

/**
 * Copies vendored files from source directory to target directory
 * with transforms applied to their content and relative path.
 */
export async function copyVendoredFilesAsync(
  options: Omit<CopyFilesOptions, 'onCopy'>
): Promise<void> {
  await copyFilesWithTransformsAsync({
    ...options,
    onCopy: (sourceFile, targetFile, matches) => {
      if (sourceFile !== targetFile) {
        logger.log('📂 Renaming %s to %s', chalk.magenta(sourceFile), chalk.magenta(targetFile));
      }
      // for (const { value, replacedWith, line } of matches) {
      //   logger.log(chalk.bold('Transformed a substring at line %s'), chalk.green(line.toString()));
      //   logger.log(chalk.red(`- ${value.trimRight()}`));
      //   logger.log(chalk.green(`+ ${replacedWith.trimRight()}`));
      // }
      // if (matches.length) {
      //   logger.log();
      // }
    },
  });
}
