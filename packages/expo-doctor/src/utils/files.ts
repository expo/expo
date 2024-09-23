import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { isFileIgnoredByRules } from './isFileIgnoredByRules';

const EASIGNORE_FILENAME = '.easignore';
const GITIGNORE_FILENAME = '.gitignore';

/**
 * Checks if a file exists and is not ignored by EAS (.easignore) or git (.gitignore).
 * @param filePath The path to the file to check.
 * @param checkEasignore Whether to check .easignore or not (defaults to true).
 * @returns `true` if the file exists and is not ignored.
 */
export async function existsAndIsNotIgnoredAsync(
  filePath: string,
  checkEasignore: boolean = true
): Promise<boolean> {
  return fs.existsSync(filePath) && !(await isFileIgnoredAsync(filePath, checkEasignore));
}

/**
 * Checks if a file is ignored by EAS (.easignore) or git (.gitignore).
 * Prioritizes .easignore if it exists, otherwise falls back to .gitignore.
 * @param filePath The path to the file to check.
 * @param checkEasignore Whether to check .easignore or not (defaults to true).
 * @returns `true` if the file is ignored, `false` otherwise.
 */
export async function isFileIgnoredAsync(
  filePath: string,
  checkEasignore: boolean = true
): Promise<boolean> {
  const rootPath = await getRootPathAsync();
  const easIgnorePath = path.join(rootPath, EASIGNORE_FILENAME);
  const gitIgnorePath = path.join(rootPath, GITIGNORE_FILENAME);

  try {
    if (fs.existsSync(easIgnorePath) && checkEasignore) {
      return isFileIgnoredByRules(filePath, easIgnorePath, rootPath);
    } else if (fs.existsSync(gitIgnorePath)) {
      await spawnAsync('git', ['check-ignore', '-q', filePath], {
        cwd: path.normalize(await getRootPathAsync()),
      });
      return true;
    } else {
      // If neither .easignore nor .gitignore exists, the file is not ignored
      return false;
    }
  } catch {
    return false;
  }
}

async function getRootPathAsync(): Promise<string> {
  return (await spawnAsync('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
}
