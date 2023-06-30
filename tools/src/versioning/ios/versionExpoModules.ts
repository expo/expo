import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { Podspec } from '../../CocoaPods';
import logger from '../../Logger';
import { Package } from '../../Packages';
import { FileTransforms, copyFileWithTransformsAsync } from '../../Transforms';
import { arrayize, searchFilesAsync } from '../../Utils';
import { getCommonExpoModulesTransforms, getVersioningModuleConfig } from './transforms/expoModulesTransforms';
import { getVersionPrefix, getVersionedDirectory } from './utils';
import { VersioningModuleConfig } from '../types';

// Label of the console's timer used during versioning
const TIMER_LABEL = 'Versioning expo modules finished in';

// The pattern that matches the dependency pods that need to be renamed in `*.podspec.json`.
const PODSPEC_DEPS_TO_RENAME_PATTERN = /^(Expo|EX|UM|EAS|React|RCT|Yoga)(?!-Folly)/;

// The pattern that matches the file that need to be renamed in `*.podspec.json`.
const PODSPEC_FILES_TO_RENAME_PATTERN = /^(Expo|EX|UM|EAS|React|RCT|Yoga|hermes-engine)(?!-Folly)/;

/**
 * Function that versions expo modules.
 */
export async function versionExpoModulesAsync(
  sdkNumber: number,
  packages: Package[]
): Promise<void> {
  const prefix = getVersionPrefix(sdkNumber);
  const commonTransforms = getCommonExpoModulesTransforms(prefix);
  const versionedDirectory = getVersionedDirectory(sdkNumber);
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  // Prepare versioning task (for single package).
  const versionPackageTask = taskQueue.wrap(async (pkg: Package) => {
    logger.log(`- ${chalk.green(pkg.podspecName!)}`);

    if (!pkg.podspecPath || !pkg.podspecName) {
      throw new Error(`Podspec for package ${pkg.packageName} not found`);
    }

    const sourceDirectory = path.join(pkg.path, path.dirname(pkg.podspecPath));
    const targetDirectory = path.join(versionedDirectory, pkg.podspecName);

    // Ensure the target directory is empty
    if (await fs.pathExists(targetDirectory)) {
      await fs.remove(targetDirectory);
    }

    const moduleConfig = getVersioningModuleConfig(prefix, pkg.packageName);

    // Create a podspec in JSON format so we don't have to keep `package.json`s
    const podspec = await generateVersionedPodspecAsync(pkg, prefix, targetDirectory, moduleConfig.mutatePodspec);

    // Find files within the package based on source_files in the podspec, except the podspec itself.
    // Podspecs depend on the corresponding `package.json`,
    // that we don't want to copy (no need to version JS files, workspace project names duplication).
    // Instead, we generate the static podspec in JSON format (see `generateVersionedPodspecAsync`).
    // Be aware that it doesn't include source files for subspecs!
    const files = await searchFilesAsync(sourceDirectory, podspec.source_files, {
      ignore: [`${pkg.podspecName}.podspec`],
    });

    // Merge common transforms with the module-specific transforms.
    const transforms: FileTransforms = {
      path: [...(commonTransforms.path ?? []), ...(moduleConfig.transforms?.path ?? [])],
      content: [...(commonTransforms.content ?? []), ...(moduleConfig.transforms?.content ?? [])],
    };

    // Copy files to the new directory with applied transforms
    for (const sourceFile of files) {
      await copyFileWithTransformsAsync({
        sourceFile,
        targetDirectory,
        sourceDirectory,
        transforms,
      });
    }
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
  targetDirectory: string,
  mutator?: VersioningModuleConfig['mutatePodspec'],
): Promise<Podspec> {
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
  if (podspec.public_header_files) {
    podspec.public_header_files = transformVersionedFiles(podspec.public_header_files, prefix);
  }
  if (podspec.pod_target_xcconfig?.HEADER_SEARCH_PATHS) {
    // using ' ' to split HEADER_SEARCH_PATHS is not 100% correct but good enough for expo-modules' podspec
    const headerSearchPaths = transformVersionedFiles(
      podspec.pod_target_xcconfig.HEADER_SEARCH_PATHS.split(' '),
      prefix
    );
    podspec.pod_target_xcconfig.HEADER_SEARCH_PATHS = headerSearchPaths.join(' ');
  }

  // Apply module-specific mutations.
  mutator?.(podspec);

  const targetPath = path.join(targetDirectory, `${prefix}${pkg.podspecName}.podspec.json`);

  // Write a new one
  await fs.outputJson(targetPath, podspec, {
    spaces: 2,
  });

  return podspec;
}

/**
 * Transform files into versioned file names.
 * For versioning `source_files` or `HEADER_SEARCH_PATHS` in podspec
 */
function transformVersionedFiles(files: string | string[], prefix: string): string[] {
  const result = arrayize(files).map((item) => {
    const dirname = path.dirname(item);
    const basename = path.basename(item);
    const versionedBasename = PODSPEC_FILES_TO_RENAME_PATTERN.test(basename)
      ? `${prefix}${basename}`
      : basename;
    return path.join(dirname, versionedBasename);
  });
  return result;
}
