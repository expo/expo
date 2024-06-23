import { getConfig, type ExpoConfig } from '@expo/config';
import { type ModPlatform } from '@expo/config-plugins';
import chalk from 'chalk';
import fs from 'fs/promises';
import { glob as globAsync } from 'glob';
import path from 'path';

import { moveAsync } from './dir';
import { generateNativeProjectsAsync, platformSanityCheckAsync } from './generateNativeProjects';
import * as logger from './logger';
import {
  normalizeNativeProjectsAsync,
  revertNormalizeNativeProjectsAsync,
} from './normalizeNativeProjects';
import { resolveFromExpoCli } from './resolveFromExpoCli';
import { createWorkingDirectoriesAsync, type WorkingDirectories } from './workingDirectories';
import { addAllToGitIndexAsync, commitAsync, diffAsync, initializeGitRepoAsync } from '../gitPatch';

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
  const { setNodeEnv } = require(
    resolveFromExpoCli(projectRoot, 'build/src/utils/nodeEnv')
  ) as typeof import('@expo/cli/src/utils/nodeEnv');

  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  const { exp } = await getConfig(projectRoot);
  const patchRoot = options.patchRoot || 'cng-patches';

  // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
  options.platforms = ensureValidPlatforms(options.platforms);

  for (const platform of options.platforms) {
    await platformSanityCheckAsync({ exp, projectRoot, platform });

    const workingDirectories = await createWorkingDirectoriesAsync(projectRoot, platform);
    try {
      await removePatchFilesAsync(patchRoot, platform);
      await fs.mkdir(path.join(projectRoot, patchRoot), { recursive: true });

      await patchProjectForPlatformAsync({
        projectRoot,
        platform,
        workingDirectories,
        patchRoot,
        exp,
        options,
      });
    } finally {
      await fs.rm(workingDirectories.rootDir, { recursive: true, force: true });
    }
  }
}

async function patchProjectForPlatformAsync({
  projectRoot,
  platform,
  workingDirectories,
  patchRoot,
  exp,
  options,
}: {
  projectRoot: string;
  platform: ModPlatform;
  workingDirectories: WorkingDirectories;
  patchRoot: string;
  exp: ExpoConfig;
  options: Omit<Parameters<typeof patchProjectAsync>[1], 'platforms'>;
}): Promise<void> {
  const { diffDir, originDir } = workingDirectories;

  debug(`Normalizing native project files for original project`);
  const backupFileMappings = await normalizeNativeProjectsAsync({
    projectRoot,
    platform,
    workingDirectories,
    backup: true,
  });

  debug(`Moving native projects to origin directory - originDir[${originDir}]`);
  await fs.rename(path.join(projectRoot, platform), originDir);

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
  const platformDiffDir = path.join(diffDir, platform);
  await initializeGitRepoAsync(diffDir);
  await moveAsync(path.join(projectRoot, platform), platformDiffDir);
  await addAllToGitIndexAsync(diffDir);
  await commitAsync(diffDir, 'Base commit from prebuild template');

  debug(`Moving the original native projects to diff repo`);
  await fs.rm(platformDiffDir, { recursive: true, force: true });
  await moveAsync(originDir, platformDiffDir);

  debug(`Generating patch file`);
  const patchFilePath = path.join(projectRoot, patchRoot, `${platform}+${templateChecksum}.patch`);
  logger.log(chalk.bold(`Saving patch file to ${patchFilePath}`));
  await diffAsync(diffDir, patchFilePath, options.diffOptions ?? []);
  const stat = await fs.stat(patchFilePath);
  if (stat.size === 0) {
    logger.log(`No changes detected, removing the patch file: ${patchFilePath}`);
    await fs.rm(patchFilePath);
  }

  if (!options.clean) {
    debug(`Moving the original native projects back to project root`);
    await moveAsync(platformDiffDir, path.join(projectRoot, platform));
    await revertNormalizeNativeProjectsAsync(backupFileMappings);
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
