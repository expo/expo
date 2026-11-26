import { consumeConfigEnvMode, loadProjectEnv, logLoadedEnv } from '@expo/env';
import chalk from 'chalk';
import { getConfig, type ExpoConfig } from 'expo/config';
import { type ModPlatform } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { addAllToGitIndexAsync, commitAsync, diffAsync, initializeGitRepoAsync } from '../gitPatch';
import { getPatchFilesAsync } from '../patchFiles';
import { moveAsync } from './dir';
import { generateNativeProjectsAsync, platformSanityCheckAsync } from './generateNativeProjects';
import * as logger from './logger';
import {
  normalizeNativeProjectsAsync,
  revertNormalizeNativeProjectsAsync,
  type BackupFileMappings,
} from './normalizeNativeProjects';
import { resolveFromExpoCli } from './resolveFromExpoCli';
import { createWorkingDirectoriesAsync } from './workingDirectories';

declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

const debug = require('debug')('patch-project') as typeof console.log;

/**
 * Entry point into the patch-project process.
 */
export async function patchProjectAsync(
  projectRoot: string,
  options: {
    /** List of platforms to prebuild. */
    platforms: ModPlatform[];
    /** Should delete the native folders after attempting to prebuild. @default false */
    clean?: boolean;
    /** URL or file path to the prebuild template. */
    template?: string;
    /** The options to pass to the `git diff` command. */
    diffOptions?: string[];
    /** The directory to save the patch files. @default `cng-patches` */
    patchRoot?: string;
  }
): Promise<void> {
  const { ensureValidPlatforms } = require(
    resolveFromExpoCli(projectRoot, 'build/src/prebuild/resolveOptions')
  ) as typeof import('@expo/cli/src/prebuild/resolveOptions');
  consumeConfigEnvMode();
  globalThis.__DEV__ = true;
  const envInfo = loadProjectEnv(projectRoot, { mode: 'development' });
  logLoadedEnv(envInfo);

  const { exp } = await getConfig(projectRoot);
  const patchRoot = path.resolve(projectRoot, options.patchRoot || 'cng-patches');

  // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
  options.platforms = ensureValidPlatforms(options.platforms);

  for (const platform of options.platforms) {
    await platformSanityCheckAsync({ exp, projectRoot, platform });
    await patchProjectForPlatformAsync({ projectRoot, platform, patchRoot, exp, options });
  }
}

async function patchProjectForPlatformAsync({
  projectRoot,
  platform,
  patchRoot,
  exp,
  options,
}: {
  projectRoot: string;
  platform: ModPlatform;
  patchRoot: string;
  exp: ExpoConfig;
  options: Omit<Parameters<typeof patchProjectAsync>[1], 'platforms'>;
}): Promise<void> {
  const workingDirectories = await createWorkingDirectoriesAsync(projectRoot, platform);
  const { diffDir, originDir } = workingDirectories;
  const platformDir = path.join(projectRoot, platform);
  const platformDiffDir = path.join(diffDir, platform);

  let backupFileMappings: BackupFileMappings = {};
  const patchFileBackups: BackupFileMappings = {};
  let newPatchFile: string | null = null;
  let originalProjectDir: string | null = null;
  try {
    await movePatchFilesAsync({
      patchRoot,
      platform,
      backupDir: path.join(workingDirectories.tmpDir, 'patches'),
      patchFileBackups,
    });
    await fs.mkdir(patchRoot, { recursive: true });

    debug(`Normalizing native project files for original project`);
    backupFileMappings = await normalizeNativeProjectsAsync({
      projectRoot,
      platform,
      workingDirectories,
      backup: true,
    });

    debug(`Moving native projects to origin directory - originDir[${originDir}]`);
    await fs.rename(platformDir, originDir);
    originalProjectDir = originDir;

    debug(`Generating native projects from prebuild template - projectRoot[${projectRoot}]`);
    logger.log(
      chalk.bold(`Generating native projects from prebuild template - platform[${platform}]`)
    );
    const templateChecksum = await generateNativeProjectsAsync(projectRoot, exp, {
      platforms: [platform],
      template: options.template,
      templateDirectory: workingDirectories.templateDir,
    });

    debug(`Normalizing native project files for generated project`);
    await normalizeNativeProjectsAsync({
      projectRoot,
      platform,
      workingDirectories,
      backup: false,
    });

    debug(`Initializing git repo for diff - diffDir[${diffDir}]`);
    await initializeGitRepoAsync(diffDir);
    await moveAsync(platformDir, platformDiffDir);
    await addAllToGitIndexAsync(diffDir);
    await commitAsync(diffDir, 'Base commit from prebuild template');

    debug(`Moving the original native projects to diff repo`);
    await fs.rm(platformDiffDir, { recursive: true, force: true });
    await moveAsync(originDir, platformDiffDir);
    originalProjectDir = platformDiffDir;

    debug(`Generating patch file`);
    const patchFilePath = path.join(patchRoot, `${platform}+${templateChecksum}.patch`);
    logger.log(chalk.bold(`Saving patch file to ${patchFilePath}`));
    newPatchFile = patchFilePath;
    await diffAsync(diffDir, patchFilePath, options.diffOptions ?? []);
    const stat = await fs.stat(patchFilePath);
    if (stat.size === 0) {
      logger.log(`No changes detected, removing the patch file: ${patchFilePath}`);
      await fs.rm(patchFilePath);
    }
  } catch (error) {
    const projectRestore = await restoreOriginalProjectAsync({
      platformDir,
      originalProjectDir,
      backupFileMappings,
    });
    const hadPatchFileBackups = Object.keys(patchFileBackups).length > 0;
    const arePatchFilesRestored = await restorePatchFilesAsync({ newPatchFile, patchFileBackups });
    if (projectRestore === 'restored' && arePatchFilesRestored) {
      // A failed step may already have told the user to delete these directories.
      logger.log(
        hadPatchFileBackups
          ? `Restored the original ${platform} project to ${platformDir} and the old patch files. Do not delete the android or ios directory, or those patch files.`
          : `Restored the original ${platform} project to ${platformDir}. Do not delete the android or ios directory.`
      );
      await fs.rm(workingDirectories.rootDir, { recursive: true, force: true });
    }
    throw error;
  }

  if (!options.clean) {
    debug(`Moving the original native projects back to project root`);
    const projectRestore = await restoreOriginalProjectAsync({
      platformDir,
      originalProjectDir,
      backupFileMappings,
    });
    if (projectRestore === 'move-failed') {
      throw new Error(
        `patch-project created the patch, but could not restore the original native project to ${platformDir}. ` +
          `Follow the steps in the message above to restore it manually.`
      );
    }
    if (projectRestore === 'revert-failed') {
      throw new Error(
        `patch-project created the patch, and the original native project is back in ${platformDir}. ` +
          `Copy each backup over its file, as the message above says, before you run patch-project again.`
      );
    }
  }
  await fs.rm(workingDirectories.rootDir, { recursive: true, force: true });
}

/**
 * Returns why the restore stopped.
 * The caller keeps the working directory unless the result is `restored`.
 */
async function restoreOriginalProjectAsync({
  platformDir,
  originalProjectDir,
  backupFileMappings,
}: {
  platformDir: string;
  /** Where the original native project is, or `null` when it is already in `platformDir`. */
  originalProjectDir: string | null;
  backupFileMappings: BackupFileMappings;
}): Promise<'restored' | 'move-failed' | 'revert-failed'> {
  if (originalProjectDir) {
    try {
      debug(`Restoring the original native projects - originalProjectDir[${originalProjectDir}]`);
      await moveAsync(originalProjectDir, platformDir);
    } catch (moveError) {
      logger.error(
        chalk.red(
          `Could not move the original native project back to ${platformDir}. ` +
            `The original project is in ${originalProjectDir}. ` +
            `Move it to ${platformDir} manually before you run patch-project again. ` +
            `A later run can delete ${originalProjectDir}.` +
            (Object.keys(backupFileMappings).length > 0
              ? `\nThen copy each backup over its file:` +
                formatBackupFileMappings(backupFileMappings)
              : '')
        )
      );
      logger.error(moveError);
      return 'move-failed';
    }
  }

  try {
    await revertNormalizeNativeProjectsAsync(backupFileMappings);
  } catch (revertError) {
    logger.error(
      chalk.red(
        `The original native project is back in ${platformDir}, but patch-project could not restore some files that it changed. ` +
          `Copy each backup over its file before you run patch-project again. ` +
          `A later run deletes the backups:` +
          formatBackupFileMappings(backupFileMappings)
      )
    );
    logger.error(revertError);
    return 'revert-failed';
  }
  return 'restored';
}

function formatBackupFileMappings(backupFileMappings: BackupFileMappings): string {
  return Object.entries(backupFileMappings)
    .map(([originalPath, backupPath]) => `\n  ${backupPath} -> ${originalPath}`)
    .join('');
}

/**
 * Moves the existing patch files into `backupDir`, so a failed run can put them back.
 * `patchFileBackups` is filled as each file moves.
 */
async function movePatchFilesAsync({
  patchRoot,
  platform,
  backupDir,
  patchFileBackups,
}: {
  patchRoot: string;
  platform: ModPlatform;
  backupDir: string;
  patchFileBackups: BackupFileMappings;
}): Promise<void> {
  for (const file of await getPatchFilesAsync(patchRoot, platform)) {
    const patchFile = path.join(patchRoot, file);
    const backupPath = path.join(backupDir, file);
    logger.log(`Moving the old patch file aside: ${patchFile}`);
    await moveAsync(patchFile, backupPath);
    patchFileBackups[patchFile] = backupPath;
  }
}

/**
 * Deletes the new patch file of a failed run, then moves the old patch files back.
 * Returns `false` when some of this could not be done.
 */
async function restorePatchFilesAsync({
  newPatchFile,
  patchFileBackups,
}: {
  /** `git diff` can create this file before it fails. */
  newPatchFile: string | null;
  patchFileBackups: BackupFileMappings;
}): Promise<boolean> {
  try {
    if (newPatchFile) {
      await fs.rm(newPatchFile, { force: true });
      newPatchFile = null;
    }
    for (const [patchFile, backupPath] of Object.entries(patchFileBackups)) {
      await moveAsync(backupPath, patchFile);
      delete patchFileBackups[patchFile];
      logger.log(`Restored the old patch file: ${patchFile}`);
    }
    return true;
  } catch (restoreError) {
    logger.error(
      chalk.red(
        `Could not restore the patch files in the patch directory. ` +
          (newPatchFile ? `Delete the incomplete patch file ${newPatchFile}. ` : '') +
          (Object.keys(patchFileBackups).length > 0
            ? `Move each old patch file back manually before you run patch-project again. ` +
              `A later run deletes them:` +
              formatBackupFileMappings(patchFileBackups)
            : '')
      )
    );
    logger.error(restoreError);
    return false;
  }
}
