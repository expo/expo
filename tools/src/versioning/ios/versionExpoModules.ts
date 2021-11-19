import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import logger from '../../Logger';
import { Package } from '../../Packages';
import { copyFileWithTransformsAsync } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import { expoModulesTransforms } from './transforms/expoModulesTransforms';
import { getVersionPrefix, getVersionedDirectory } from './utils';

// Label of the console's timer used during versioning
const TIMER_LABEL = 'Versioning expo modules finished in';

// The pattern that matches the dependency pods that need to be renamed in `*.podspec.json`.
const PODSPEC_DEPS_TO_RENAME_PATTERN = /^(Expo|EX(?!GL_CPP)|UM|React|RCT|Yoga)/;

/**
 * Function that versions expo modules.
 */
export async function versionExpoModulesAsync(
  sdkNumber: number,
  packages: Package[]
): Promise<void> {
  const prefix = getVersionPrefix(sdkNumber);
  const transforms = expoModulesTransforms(prefix);
  const versionedDirectory = getVersionedDirectory(sdkNumber);
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  // Prepare versioning task (for single package).
  const versionPackageTask = taskQueue.wrap(async (pkg) => {
    logger.log(`- ${chalk.green(pkg.podspecName!)}`);
    const sourceDirectory = path.join(pkg.path, pkg.iosSubdirectory);
    const targetDirectory = path.join(versionedDirectory, pkg.podspecName!);

    // Find all iOS files within the package, except the podspec.
    // Podspecs depend on the corresponding `package.json`,
    // that we don't want to copy (no need to version JS files, workspace project names duplication).
    // Instead, we generate the static podspec in JSON format (see `generateVersionedPodspecAsync`).
    const files = await searchFilesAsync(sourceDirectory, '**', {
      ignore: [`${pkg.podspecName}.podspec`],
    });

    // Ensure the target directory is empty
    if (await fs.pathExists(targetDirectory)) {
      await fs.remove(targetDirectory);
    }

    // Copy files to the new directory with applied transforms
    for (const sourceFile of files) {
      await copyFileWithTransformsAsync({
        sourceFile,
        targetDirectory,
        sourceDirectory,
        transforms,
      });
    }

    // Create a podspec in JSON format so we don't have to keep `package.json`s
    await generateVersionedPodspecAsync(pkg, prefix, targetDirectory);
  });

  logger.info('📂 Versioning expo modules');
  console.time(TIMER_LABEL);

  // Enqueue packages to version.
  await Promise.all(packages.map(versionPackageTask));

  console.timeEnd(TIMER_LABEL);
}

/**
 * Generates versioned static podspec in JSON format.
 */
async function generateVersionedPodspecAsync(
  pkg: Package,
  prefix: string,
  targetDirectory: string
) {
  const podspec = await pkg.getPodspecAsync();

  if (!podspec) {
    throw new Error(`Podspec for package ${pkg.packageName} not found`);
  }
  if (podspec.name) {
    podspec.name = `${prefix}${podspec.name}`;
  }
  if (podspec.header_dir) {
    podspec.header_dir = `${prefix}${podspec.header_dir}`;
  }
  if (podspec.dependencies) {
    Object.keys(podspec.dependencies)
      .filter((key) => PODSPEC_DEPS_TO_RENAME_PATTERN.test(key))
      .forEach((key) => {
        const newKey = `${prefix}${key}`;
        podspec.dependencies[newKey] = podspec.dependencies[key];
        delete podspec.dependencies[key];
      });
  }

  if (['expo-updates', 'expo-constants'].includes(pkg.packageName)) {
    // For expo-updates and expo-constants in Expo Go, we don't need app.config and app.manifest in versioned code.
    delete podspec['script_phases'];
    delete podspec['resource_bundles'];
  }

  const targetPath = path.join(targetDirectory, `${prefix}${pkg.podspecName}.podspec.json`);

  // Write a new one
  await fs.outputJson(targetPath, podspec, {
    spaces: 2,
  });
}
