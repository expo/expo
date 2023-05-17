import { ModPlatform } from '@expo/config-plugins';
import { MergeResults } from '@expo/config-plugins/build/utils/generateCode';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { copySync, directoryExistsAsync } from '../utils/dir';
import { mergeGitIgnorePaths } from '../utils/mergeGitIgnorePaths';

const debug = require('debug')('expo:prebuild:copyTemplateFiles') as typeof console.log;

type CopyFilesResults = {
  /** Merge results for the root `.gitignore` file */
  gitignore: MergeResults | null;
  /** List of file paths that were copied from the template into the project. */
  copiedPaths: string[];
  /** List of file paths that were skipped due to a number of factors. */
  skippedPaths: string[];
};

/**
 * Return true if the given platforms all have an internal `.gitignore` file.
 *
 * @param projectRoot
 * @param platforms
 */
function hasAllPlatformSpecificGitIgnores(projectRoot: string, platforms: ModPlatform[]): boolean {
  return platforms.reduce<boolean>(
    (p, platform) => p && fs.existsSync(path.join(projectRoot, platform, '.gitignore')),
    true
  );
}

/** Create a custom log message based on the copy file results. */
export function createCopyFilesSuccessMessage(
  platforms: ModPlatform[],
  { skippedPaths, gitignore }: CopyFilesResults
): string {
  let message = `Created native project${platforms.length > 1 ? 's' : ''}`;

  if (skippedPaths.length) {
    message += chalk.dim(
      ` | ${skippedPaths.map((path) => chalk.bold(`/${path}`)).join(', ')} already created`
    );
  }
  if (!gitignore) {
    message += chalk.dim(` | gitignore skipped`);
  } else if (!gitignore.didMerge) {
    message += chalk.dim(` | gitignore already synced`);
  } else if (gitignore.didMerge && gitignore.didClear) {
    message += chalk.dim(` | synced gitignore`);
  }
  return message;
}

/** Copy template files into the project and possibly merge the `.gitignore` files.  */
export async function copyTemplateFilesAsync(
  projectRoot: string,
  {
    templateDirectory,
    platforms,
  }: {
    /** File path to the template directory. */
    templateDirectory: string;
    /** List of platforms to copy against. */
    platforms: ModPlatform[];
  }
): Promise<CopyFilesResults> {
  const copyResults = await copyPathsFromTemplateAsync(projectRoot, {
    templateDirectory,
    copyFilePaths: platforms,
  });

  const hasPlatformSpecificGitIgnores = hasAllPlatformSpecificGitIgnores(
    templateDirectory,
    platforms
  );
  debug(`All platforms have an internal gitignore: ${hasPlatformSpecificGitIgnores}`);

  // TODO: Remove gitignore modifications -- maybe move to `npx expo-doctor`
  const gitignore = hasPlatformSpecificGitIgnores
    ? null
    : mergeGitIgnorePaths(
        path.join(projectRoot, '.gitignore'),
        path.join(templateDirectory, '.gitignore')
      );

  return { ...copyResults, gitignore };
}

async function copyPathsFromTemplateAsync(
  /** File path to the project. */
  projectRoot: string,
  {
    templateDirectory,
    copyFilePaths,
  }: {
    /** File path to the template project. */
    templateDirectory: string;
    /** List of relative paths to copy from the template to the project. */
    copyFilePaths: string[];
  }
): Promise<Pick<CopyFilesResults, 'copiedPaths' | 'skippedPaths'>> {
  const copiedPaths = [];
  const skippedPaths = [];
  for (const copyFilePath of copyFilePaths) {
    const projectPath = path.join(projectRoot, copyFilePath);
    if (!(await directoryExistsAsync(projectPath))) {
      copiedPaths.push(copyFilePath);
      copySync(path.join(templateDirectory, copyFilePath), projectPath);
    } else {
      skippedPaths.push(copyFilePath);
    }
  }
  debug(`Copied files:`, copiedPaths);
  debug(`Skipped files:`, copiedPaths);
  return { copiedPaths, skippedPaths };
}
