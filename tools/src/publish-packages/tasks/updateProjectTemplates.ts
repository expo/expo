import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { getAvailableProjectTemplatesAsync, Template } from '../../ProjectTemplates';
import { sdkVersionAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];
const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');

/**
 * Finds target version range, that is usually `bundledModuleVersion` param,
 * but in some specific cases we want to use different version range.
 *
 * @param targetVersionRange Version range that exists in `bundledNativeModules.json` file.
 * @param currentVersion Version range that is currenty used in the template.
 * @param sdkVersion SDK version string to which we're upgrading.
 */
function resolveTargetVersionRange(
  targetVersionRange: string,
  currentVersion: string,
  sdkVersion: string
) {
  if (currentVersion === '*') {
    return currentVersion;
  }
  if (/^https?:\/\/.*\/react-native\//.test(currentVersion)) {
    return `https://github.com/expo/react-native/archive/sdk-${sdkVersion}.tar.gz`;
  }
  return targetVersionRange;
}

/**
 * Updates single project template dependencies and it's version.
 *
 * @param template Template object containing name and path.
 * @param modulesToUpdate An object with module names to update and their version ranges.
 * @param expoVersion Expo package version string.
 */
async function updateTemplateAsync(
  template: Template,
  modulesToUpdate: object,
  expoVersion: string
): Promise<boolean> {
  console.log(`Updating ${chalk.bold.green(template.name)}...`);

  const packageJsonPath = path.join(template.path, 'package.json');
  const packageJson = require(packageJsonPath);

  let changedDependencies = 0;
  for (const dependencyKey of DEPENDENCIES_KEYS) {
    const dependencies = packageJson[dependencyKey];

    if (!dependencies) {
      continue;
    }
    for (const dependencyName in dependencies) {
      const currentVersion = dependencies[dependencyName];
      const targetVersion = resolveTargetVersionRange(
        modulesToUpdate[dependencyName],
        currentVersion,
        semver.major(expoVersion).toString()
      );

      if (targetVersion) {
        if (targetVersion === currentVersion) {
          console.log(
            chalk.yellow('>'),
            `Current version ${chalk.cyan(targetVersion)} of ${chalk.blue(
              dependencyName
            )} is up-to-date.`
          );
        } else {
          console.log(
            chalk.yellow('>'),
            `Updating ${chalk.blue(dependencyName)} from ${chalk.cyan(
              currentVersion
            )} to ${chalk.cyan(targetVersion)}...`
          );
          packageJson[dependencyKey][dependencyName] = targetVersion;
          changedDependencies += 1;
        }
      }
    }
  }
  if (changedDependencies > 0) {
    const { newVersion } = await inquirer.prompt<{ newVersion: string }>([
      {
        type: 'input',
        name: 'newVersion',
        message: `What is the new version for ${chalk.green(template.name)} package?`,
        default: semver.lt(template.version, expoVersion)
          ? expoVersion
          : semver.inc(template.version, 'patch'),
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          if (semver.lt(value, template.version)) {
            return `${value} shouldn't be lower than the current version (${template.version})`;
          }
          return true;
        },
      },
    ]);
    packageJson.version = newVersion;

    const appJsonPath = path.join(template.path, 'app.json');
    if (
      (await fs.pathExists(appJsonPath)) &&
      (await JsonFile.getAsync(appJsonPath, 'expo.sdkVersion', null))
    ) {
      // Make sure SDK version in `app.json` is correct
      console.log(
        `Setting ${chalk.magenta('expo.sdkVersion')} to ${chalk.green(
          expoVersion
        )} in template's app.json...`
      );

      await JsonFile.setAsync(path.join(template.path, 'app.json'), 'expo.sdkVersion', expoVersion);
    }
  }
  await JsonFile.writeAsync(packageJsonPath, packageJson);
  return changedDependencies > 0;
}

/**
 * Updates versions in templates.
 */
export const updateProjectTemplates = new Task<TaskArgs>(
  {
    name: 'updateProjectTemplates',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['templates/**/package.json'],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info(`\n🆙 Updating versions in templates ${chalk.magenta.bold('package.json')}s...`);

    const bundledNativeModules = require(BUNDLED_NATIVE_MODULES_PATH);
    const templates = await getAvailableProjectTemplatesAsync();
    const expoVersion = await sdkVersionAsync();

    const modulesToUpdate = {
      ...bundledNativeModules,
      expo: `~${expoVersion}`,
    };
    const templatesToRelease: Template[] = [];
    for (const template of templates) {
      if (await updateTemplateAsync(template, modulesToUpdate, expoVersion)) {
        templatesToRelease.push(template);
      }
    }
    return [parcels, options, templatesToRelease];
  }
);
