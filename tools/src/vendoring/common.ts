import { styleText } from 'node:util';

import logger from '../Logger';
import { CopyFileOptions, FileTransform, copyFileWithTransformsAsync } from '../Transforms';

/**
 * Copies vendored files from source directory to target directory
 * with transforms applied to their content and relative path.
 */
export async function copyVendoredFilesAsync(
  files: Set<string>,
  options: Omit<CopyFileOptions, 'sourceFile'>
): Promise<void> {
  const unusedTransforms = new Set<FileTransform>(options.transforms.content);
  for (const sourceFile of files) {
    const { targetFile, transformsUsed } = await copyFileWithTransformsAsync({
      sourceFile,
      ...options,
    });
    transformsUsed.forEach((transform) => unusedTransforms.delete(transform));

    if (sourceFile !== targetFile) {
      logger.log(
        '📂 Renamed %s to %s',
        styleText('magenta', sourceFile),
        styleText('magenta', targetFile)
      );
    }
  }
  for (const unusedTransform of unusedTransforms) {
    logger.warn(
      '⚠️ A transform was never applied to vendored code.\nThis can indicate outdated transforms or bugs in the vendored package.\nPath(s): %s',
      styleText('magenta', String(unusedTransform.paths ?? ''))
    );
  }
}
