import spawnAsync from '@expo/spawn-async';
import path from 'path';

/**
 * Checks if a file is ignored by git.
 * @param filePath The path to the file to check.
 * @returns `true` if the file is ignored by git.
 */
export async function isFileIgnoredAsync(filePath: string): Promise<boolean> {
  try {
    await spawnAsync('git', ['check-ignore', '-q', filePath], {
      cwd: path.normalize(await getRootPathAsync()),
    });
    return true;
  } catch {
    return false;
  }
}

async function getRootPathAsync(): Promise<string> {
  return (await spawnAsync('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
}
