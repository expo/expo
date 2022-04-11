import chalk from 'chalk';
import fs from 'fs-extra';
import * as path from 'path';

import * as Log from '../log';

// Any of these files are allowed to exist in the projectRoot
const TOLERABLE_FILES = [
  // System
  '.DS_Store',
  'Thumbs.db',
  // Git
  '.git',
  '.gitattributes',
  '.gitignore',
  // Project
  '.npmignore',
  '.travis.yml',
  'LICENSE',
  'docs',
  '.idea',
  // Package manager
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
];

export function getConflictsForDirectory(
  projectRoot: string,
  tolerableFiles: string[] = TOLERABLE_FILES
): string[] {
  return fs
    .readdirSync(projectRoot)
    .filter((file: string) => !(/\.iml$/.test(file) || tolerableFiles.includes(file)));
}

export async function assertFolderEmptyAsync({
  projectRoot,
  folderName = path.dirname(projectRoot),
  overwrite,
}: {
  projectRoot: string;
  folderName?: string;
  overwrite: boolean;
}): Promise<boolean> {
  const conflicts = getConflictsForDirectory(projectRoot);
  if (conflicts.length) {
    Log.log();
    Log.log(`The directory ${chalk.green(folderName)} has files that might be overwritten:`);
    Log.log();
    for (const file of conflicts) {
      Log.log(`  ${file}`);
    }

    if (overwrite) {
      Log.log();
      Log.log(`Removing existing files from ${chalk.green(folderName)}`);
      await Promise.all(conflicts.map((conflict) => fs.remove(path.join(projectRoot, conflict))));
      return true;
    }

    return false;
  }
  return true;
}
