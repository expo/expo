import fs from 'fs-extra';
import path from 'path';

/**
 * Creates file with given content with possible parent directories creation.
 */
export async function createDirAndWriteFile(filePath: string, content: string) {
  if (!(await fs.pathExists(path.dirname(filePath)))) {
    await fs.mkdirp(path.dirname(filePath));
  }
  await fs.writeFile(filePath, content);
}

/**
 * Reads given file as UTF-8 with fallback to given content when file is not found.
 */
export async function readFileWithFallback(filePath: string, fallbackContent?: string) {
  if (await fs.pathExists(filePath)) {
    return fs.readFile(filePath, 'utf-8');
  }
  if (fallbackContent) {
    return fallbackContent;
  }
  throw Error(`File not found ${filePath}`);
}
