import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { parseIgnoreFiles } from './ignoreFiles';

async function isGitIgnored(filePath: string, rootPath = process.cwd()): Promise<boolean | null> {
  let result: spawnAsync.SpawnPromise<spawnAsync.SpawnResult> | undefined;
  try {
    filePath = path.resolve(rootPath, filePath);
    await (result = spawnAsync('git', ['check-ignore', '-q', filePath], {
      cwd: path.normalize(rootPath),
    }));
    return true;
  } catch (error) {
    switch (result?.child?.exitCode) {
      case 1:
        return false;
      // NOTE: 128 and other codes indicate that this isn't an initialized git repository
      case 128:
      default:
        return null;
    }
  }
}

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
): Promise<boolean | null> {
  let isIgnored: boolean | null | undefined;
  filePath = path.resolve(filePath);

  // We first just check git. This will return a nullish value if the repo isn't initialized
  isIgnored = await isGitIgnored(filePath);
  if (isIgnored) {
    return isIgnored;
  }

  // Otherwise, we use the ignore files manually
  const ignoreFiles = await parseIgnoreFiles(path.dirname(filePath));
  // We only check git, if the `git check-ignore` command failed
  if (isIgnored == null && (isIgnored = ignoreFiles.git?.(filePath))) {
    return true;
  }

  if (checkEasignore) {
    // We always must check the .easignore, even if `isGitIgnored` was already run in this case,
    // since it's an "overlay" on top of git-ignored files
    const isEASIgnored = ignoreFiles.eas?.(filePath);
    if (isEASIgnored != null) {
      return isEASIgnored;
    }
  }

  // Will return `null` if the status of the file is unknown
  return isIgnored ?? null;
}
