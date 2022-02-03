import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { PACKAGES_DIR } from '../Constants';
import { Template, getAvailableProjectTemplatesAsync } from '../ProjectTemplates';
import { getNewestSDKVersionAsync, sdkVersionAsync } from '../ProjectVersions';

type ActionOptions = {
  sdkVersion?: string;
};

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
 * Updates single project template.
 *
 * @param template Template object containing name and path.
 * @param modulesToUpdate An object with module names to update and their version ranges.
 * @param sdkVersion SDK version string to which we're upgrading.
 */
async function updateTemplateAsync(
  template: Template,
  modulesToUpdate: object,
  sdkVersion: string
): Promise<void> {
  console.log(`Updating ${chalk.bold.green(template.name)}...`);

  const packageJsonPath = path.join(template.path, 'package.json');
  const packageJson = require(packageJsonPath);

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
        sdkVersion
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
        }
      }
    }
  }
  await JsonFile.writeAsync(packageJsonPath, packageJson);
}

/**
 * Removes template's `yarn.lock` and runs `yarn`.
 *
 * @param templatePath Root path of the template.
 */
async function yarnTemplateAsync(templatePath: string): Promise<void> {
  console.log(chalk.yellow('>'), 'Yarning...');

  const yarnLockPath = path.join(templatePath, 'yarn.lock');

  if (await fs.pathExists(yarnLockPath)) {
    // We do want to always install the newest possible versions that match bundledNativeModules versions,
    // so let's remove yarn.lock before updating re-yarning dependencies.
    await fs.remove(yarnLockPath);
  }
  await spawnAsync('yarn', [], {
    stdio: 'ignore',
    cwd: templatePath,
    env: process.env,
  });
}

async function action(options: ActionOptions) {
  // At this point of the release process all platform should have the same newest SDK version.
  const sdkVersion = options.sdkVersion ?? (await getNewestSDKVersionAsync('ios'));

  if (!sdkVersion) {
    throw new Error(
      `Cannot infer current SDK version - please use ${chalk.gray('--sdkVersion')} flag.`
    );
  }

  const bundledNativeModules = require(BUNDLED_NATIVE_MODULES_PATH);
  const templates = await getAvailableProjectTemplatesAsync();
  const expoVersion = await sdkVersionAsync();

  const modulesToUpdate = {
    ...bundledNativeModules,
    expo: `~${expoVersion}`,
  };

  for (const template of templates) {
    await updateTemplateAsync(template, modulesToUpdate, sdkVersion);
    await yarnTemplateAsync(template.path);
    console.log(chalk.yellow('>'), chalk.green('Success!'), '\n');
  }
}

export default (program: Command) => {
  program
    .command('update-project-templates')
    .alias('update-templates', 'upt')
    .description(
      'Updates dependencies of project templates to the versions that are defined in bundledNativeModules.json file.'
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version for which the project templates should be updated. Defaults to the newest SDK version.'
    )
    .asyncAction(action);
};
