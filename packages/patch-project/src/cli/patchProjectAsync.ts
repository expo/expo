import { consumeConfigEnvMode, loadProjectEnv, logLoadedEnv } from '@expo/env';
import chalk from 'chalk';
import { getConfig, type ExpoConfig } from 'expo/config';
import { type ModPlatform } from 'expo/config-plugins';
import fs from 'fs/promises';
import { glob as globAsync } from 'glob';
import path from 'path';

import { addAllToGitIndexAsync, commitAsync, diffAsync, initializeGitRepoAsync } from '../gitPatch';
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
  const patchRoot = options.patchRoot || 'cng-patches';

  // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
  options.platforms = ensureValidPlatforms(options.platforms);

  for (const platform of options.platforms) {
    await platformSanityCheckAsync({ exp, projectRoot, platform });

    await removePatchFilesAsync(patchRoot, platform);
    await fs.mkdir(path.join(projectRoot, patchRoot), { recursive: true });

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
  let originalProjectDir: string | null = null;
  let shouldRemoveWorkingDirectories = true;
  try {
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
    const patchFilePath = path.join(
      projectRoot,
      patchRoot,
      `${platform}+${templateChecksum}.patch`
    );
    logger.log(chalk.bold(`Saving patch file to ${patchFilePath}`));
    await diffAsync(diffDir, patchFilePath, options.diffOptions ?? []);
    const stat = await fs.stat(patchFilePath);
    if (stat.size === 0) {
      logger.log(`No changes detected, removing the patch file: ${patchFilePath}`);
      await fs.rm(patchFilePath);
    }

    if (!options.clean) {
      debug(`Moving the original native projects back to project root`);
      await moveAsync(platformDiffDir, platformDir);
      originalProjectDir = null;
      await revertNormalizeNativeProjectsAsync(backupFileMappings);
    }
  } catch (error) {
    shouldRemoveWorkingDirectories = await restoreOriginalProjectAsync({
      platformDir,
      originalProjectDir,
      backupFileMappings,
      workingRootDir: workingDirectories.rootDir,
    });
    throw error;
  } finally {
    if (shouldRemoveWorkingDirectories) {
      await fs.rm(workingDirectories.rootDir, { recursive: true, force: true });
    }
  }
}

/** Returns `false` when the original files could not be restored and are still in the working directory. */
async function restoreOriginalProjectAsync({
  platformDir,
  originalProjectDir,
  backupFileMappings,
  workingRootDir,
}: {
  platformDir: string;
  originalProjectDir: string | null;
  backupFileMappings: BackupFileMappings;
  workingRootDir: string;
}): Promise<boolean> {
  try {
    if (originalProjectDir) {
      debug(`Restoring the original native projects - originalProjectDir[${originalProjectDir}]`);
      await moveAsync(originalProjectDir, platformDir);
    }
    await revertNormalizeNativeProjectsAsync(backupFileMappings);
    return true;
  } catch (restoreError) {
    logger.error(
      chalk.red(
        `Could not restore the original native project to ${platformDir} after patch-project failed. ` +
          `The original files are still in ${workingRootDir}. ` +
          `Move them back manually before you run patch-project again, because the next run deletes that directory.`
      )
    );
    logger.error(restoreError);
    return false;
  }
}

async function removePatchFilesAsync(patchRoot: string, platform: ModPlatform): Promise<void> {
  const patchFiles = await globAsync(`${platform}*.patch`, { cwd: patchRoot, absolute: true });
  await Promise.all(
    patchFiles.map((file) => {
      logger.log(`Removing patch file: ${file}`);
      return fs.rm(file, { force: true });
    })
  );
}
