import spawnAsync from '@expo/spawn-async';
import { green } from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { ExpoModuleConfig, Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import type { CommandOptions, Parcel, TaskArgs } from '../types';
import { updateAndroidProjects } from './updateAndroidProjects';

const EXCLUDE = ['expo-module-template-local', 'expo-module-template'];

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
        batch.log('  ', '  ', `${green(pkg.packageName)}: ${publicationCommand}`);
      } else {
        batch.log('  ', '  ', `${green(pkg.packageName)}:`);
        for (const command of publicationCommands) {
          batch.log('  ', '  ', '  ', `${command}`);
        }
      }

      return publicationCommands;
    });
    batch.flush();

    logger.log('  ', 'Publishing Android artifacts...');
    // Run Gradle tasks in one batch to speed up the process.
    await spawnAsync('./gradlew', gradleTasks, {
      cwd: path.join(EXPO_DIR, 'apps/bare-expo/android'),
      stdio: 'inherit',
    });
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
