import chalk from 'chalk';
import path from 'path';

import * as Log from '../log';
import { copyAsync, removeAsync } from '../utils/dir';

export async function copyBinaryToOutputAsync(
  binaryPath: string,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, path.basename(binaryPath));
  if (outputPath === binaryPath) {
    return outputPath;
  }
  await removeAsync(outputPath);
  await copyAsync(binaryPath, outputPath);
  Log.log(chalk`{dim Copied to} ${outputPath}`);
  return outputPath;
}
