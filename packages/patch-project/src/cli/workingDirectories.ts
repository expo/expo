import assert from 'assert';
import { type ModPlatform } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { ensureDirectoryAsync } from './dir';

const WORKING_DIR_ROOT = '.patch-project-tmp';

export interface WorkingDirectories {
  /** Root directory for all the working directories */
  rootDir: string;
  /** Temporary directory to save template files before copying native projects. */
  templateDir: string;
  /** The temporary Git repository to generate diffs. */
  diffDir: string;
  /** The temporary directory to save the original native projects. */
  originDir: string;
  /** The temporary directory to save the misc files. */
  tmpDir: string;
}

/**
 * Create working directories for the patch-project process.
 */
export async function createWorkingDirectoriesAsync(
  projectRoot: string,
  platform: ModPlatform
): Promise<WorkingDirectories> {
  // We put the temporary working directories inside the project root so moving files is fast.
  const rootDir = path.join(projectRoot, WORKING_DIR_ROOT, platform);
  await fs.rm(rootDir, { recursive: true, force: true });
  return {
    rootDir: await ensureAsync(rootDir),
    templateDir: await ensureAsync(path.join(rootDir, 'template')),
    diffDir: await ensureAsync(path.join(rootDir, 'diff')),
    originDir: await ensureAsync(path.join(rootDir, 'origin')),
    tmpDir: await ensureAsync(path.join(rootDir, 'tmp')),
  };
}

export async function ensureAsync(path: string): Promise<string> {
  const result = await ensureDirectoryAsync(path);
  assert(result, 'The return value should be string when recursive is true');
  return result;
}
