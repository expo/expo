import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import inquirer from 'inquirer';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { ExpoModuleConfig, Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import type { CommandOptions, Parcel, TaskArgs } from '../types';
import { updateAndroidProjects } from './updateAndroidProjects';

const EXCLUDE = ['expo-module-template-local', 'expo-module-template'];

/**
 * Finds and removes stale build directories (*.cxx and android/build) that can cause build issues.
 * Prompts the user for confirmation before deletion.
 *
 * This cleanup may slow down the publish process, but skipping it often leads to compile errors
 * during Android artifact publishing that make the whole process more tedious to recover from.
 */
async function cleanupStaleBuildDirectories(): Promise<void> {
  const packagesDir = path.join(EXPO_DIR, 'packages');

  // Find all *.cxx directories and android/build directories
  // Use trailing slash to match only directories
  const cxxDirs = await glob('**/*.cxx/', {
    cwd: packagesDir,
    absolute: true,
  });

  const androidBuildDirs = await glob('**/android/build/', {
    cwd: packagesDir,
    absolute: true,
  });

  // Remove trailing slashes from paths
  const dirsToRemove = [...cxxDirs, ...androidBuildDirs].map((dir) => dir.replace(/\/$/, ''));

  if (dirsToRemove.length === 0) {
    return;
  }

  const promptForCleanup = async (): Promise<boolean> => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        prefix: '🧹',
        message: chalk.cyan(
          `Found ${dirsToRemove.length} stale build director${dirsToRemove.length === 1 ? 'y' : 'ies'} (*.cxx, android/build). Remove?`
        ),
        choices: [
          { name: 'Yes', value: 'yes' },
          { name: 'No', value: 'no' },
          { name: 'List all', value: 'list' },
        ],
        default: 'yes',
      },
    ]);

    if (action === 'list') {
      logger.log();
      for (const dir of dirsToRemove) {
        logger.log('  ', chalk.gray(path.relative(EXPO_DIR, dir)));
      }
      logger.log();
      return promptForCleanup();
    }

    return action === 'yes';
  };

  if (await promptForCleanup()) {
    logger.log('  ', 'Removing stale build directories...');
    await Promise.all(dirsToRemove.map((dir) => fs.remove(dir)));
    logger.success('  ', 'Removed stale build directories.');
  } else {
    logger.log('  ', 'Skipping cleanup of stale build directories.');
  }
}

export const publishAndroidArtifacts = new Task<TaskArgs>(
  {
    name: 'publishAndroidArtifacts',
    dependsOn: [updateAndroidProjects],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // If only templates are being published, skip Android artifacts step entirely
    if (options.templatesOnly) {
      logger.log('\n🤖 Skipping publishing Android artifacts (templates-only).');
      return;
    }
    if (options.skipAndroidArtifacts) {
      logger.log('\n🤖 Skipping publishing Android artifacts.');
      return;
    }

    // Clean up stale build directories before building
    await cleanupStaleBuildDirectories();

    const packages = parcels.map((parcels) => parcels.pkg);

    // Collect all packages that have Android artifacts to publish.
    const androidPackages = packages.filter((pkg) => {
      const moduleConfig = pkg.expoModuleConfig;
      if (!moduleConfig) {
        return false;
      }
      if (!moduleConfig.platforms.includes('android')) {
        return false;
      }
      if (EXCLUDE.includes(pkg.packageName)) {
        return false;
      }
      return true;
    });

    if (androidPackages.length === 0) {
      logger.log('\n🤖 No Android artifacts to publish.');
      return;
    }

    logger.info('\n🤖 Publishing Android artifacts...');

    logger.log('  ', 'Removing existing publications...');
    // Remove existing publications from expo-module.config.json
    await Promise.all(androidPackages.map((pkg) => removeExistingPublications(pkg)));

    const batch = logger.batch();
    batch.log('  ', 'Collecting publication Gradle tasks...');
    // Collect all Gradle tasks to publish Android artifacts.
    const gradleTasks = androidPackages.flatMap((pkg) => {
      const publicationCommands = getPublicationCommands(pkg.packageName, pkg.expoModuleConfig!);

      if (publicationCommands.length === 1) {
        const publicationCommand = publicationCommands[0];
        batch.log('  ', '  ', `${chalk.green(pkg.packageName)}: ${publicationCommand}`);
      } else {
        batch.log('  ', '  ', `${chalk.green(pkg.packageName)}:`);
        for (const command of publicationCommands) {
          batch.log('  ', '  ', '  ', `${command}`);
        }
      }

      return publicationCommands;
    });
    batch.flush();

    logger.log('  ', 'Publishing Android artifacts...');
    // Run Gradle tasks in one batch to speed up the process.
    await spawnAsync(
      './gradlew',
      [...gradleTasks, '--no-build-cache', '--no-configuration-cache'],
      {
        cwd: path.join(EXPO_DIR, 'apps/bare-expo/android'),
        stdio: 'inherit',
      }
    );
    logger.success('  ', 'Done!');
  }
);

function getPublicationCommands(packageName: string, moduleConfig: ExpoModuleConfig): string[] {
  const androidProjectsName = new Set<string>();
  androidProjectsName.add(moduleConfig.android?.name ?? convertPackageToProjectName(packageName));

  for (const subproject of moduleConfig.android?.projects ?? []) {
    const subprojectName = subproject.name;
    if (subprojectName) {
      androidProjectsName.add(subprojectName);
    }
  }

  return [...androidProjectsName].map((projectName) => `:${projectName}:expoPublish`);
}

async function removeExistingPublications(pkg: Package) {
  let needToUpdate = false;

  if (pkg.expoModuleConfig?.android?.publication) {
    needToUpdate = true;
    delete pkg.expoModuleConfig?.android?.publication;
  }

  pkg.expoModuleConfig?.android?.projects?.forEach((project) => {
    if (project.publication) {
      needToUpdate = true;
      delete project.publication;
    }
  });

  if (!needToUpdate) {
    return;
  }

  const stringifyConfig = JSON.stringify(pkg.expoModuleConfig, null, 2);

  await fs.writeFile(pkg.expoModulesConfigPath, stringifyConfig, 'utf-8');
  return spawnAsync('yarn', ['prettier', '--write', pkg.expoModulesConfigPath], {
    cwd: pkg.path,
  });
}

/**
 * Converts the package name to Android's project name.
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 */
function convertPackageToProjectName(packageName: string): string {
  return packageName.replace(/^@/g, '').replace(/\W+/g, '-');
}
