import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const { magenta, green, blue, cyan } = chalk;

const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');
const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];

/**
 * Finds target version.
 *
 * @param targetVersionRange Version range that exists in `bundledNativeModules.json` file.
 * @param currentVersion Version range that is currenty used in the template.
 */
function resolveTargetVersionRange(targetVersionRange: string, currentVersion: string) {
  if (currentVersion === '*') {
    return currentVersion;
  }
  return targetVersionRange;
}

/**
 * Updates single project template.
 *
 * @param template Template object containing name and path.
 * @param modulesToUpdate An object with module names to update and their version ranges.
 */
async function updateTemplateAsync(parcel: Parcel, modulesToUpdate: Record<string, string>) {
  logger.info('  ', `${green.bold(parcel.pkg.packageName)}...`);

  const packageJsonPath = path.join(parcel.pkg.path, 'package.json');
  // Read fresh JSON from disk to avoid Node's require cache returning stale data.
  const packageJson = await JsonFile.readAsync(packageJsonPath);

  for (const dependencyKey of DEPENDENCIES_KEYS) {
    const dependencies = packageJson[dependencyKey];
    if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) {
      continue;
    }
    const deps = dependencies as Record<string, string>;
    for (const dependencyName of Object.keys(deps)) {
      const currentVersion = deps[dependencyName];
      const targetVersion = resolveTargetVersionRange(
        modulesToUpdate[dependencyName],
        currentVersion
      );
      if (!targetVersion || targetVersion === currentVersion) {
        continue;
      }
      logger.log(
        '    >',
        `Updating ${blue(dependencyName)} from ${cyan(currentVersion)} to ${cyan(targetVersion)}...`
      );
      deps[dependencyName] = targetVersion;
    }
  }
  await JsonFile.writeAsync(packageJsonPath, packageJson);
}

/**
 * Updates project templates to use a versions specified in the `BundledNativeModules`.
 */
export const updateProjectTemplates = new Task<TaskArgs>(
  {
    name: 'updateProjectTemplates',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['templates/**/package.json'],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const bundledNativeModules = require(BUNDLED_NATIVE_MODULES_PATH);

    logger.info(`\n🆙 Updating ${magenta.bold('templates')} with bundledNativeModules...`);

    for (const parcel of parcels) {
      if (!parcel.pkg.isTemplate()) {
        continue;
      }
      await updateTemplateAsync(parcel, bundledNativeModules);
    }
  }
);
