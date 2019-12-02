import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import JsonFile from '@expo/json-file';
import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';

import { PACKAGES_DIR } from '../Constants';
import { getAvailableProjectTemplatesAsync } from '../ProjectTemplates';
import { getNewestSDKVersionAsync } from '../ProjectVersions';

type ActionOptions = {
  sdkVersion?: string;
};

const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];
const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');

async function action(options: ActionOptions) {
  const bundledNativeModules = require(BUNDLED_NATIVE_MODULES_PATH);
  const templates = await getAvailableProjectTemplatesAsync();

  // At this point of the release process all platform should have the same newest SDK version.
  const sdkVersion = options.sdkVersion || await getNewestSDKVersionAsync('ios');

  for (const template of templates) {
    console.log(`Updating ${chalk.green(template.name)}...`);

    const packageJsonPath = path.join(template.path, 'package.json');
    const appJsonPath = path.join(template.path, 'app.json');

    const packageJson = require(packageJsonPath);

    for (const dependencyKey of DEPENDENCIES_KEYS) {
      const dependencies = packageJson[dependencyKey];

      if (dependencies) {
        for (const dependencyName in dependencies) {
          let targetVersion = bundledNativeModules[dependencyName];

          if (dependencies[dependencyName] === '*') {
            continue;
          }
          if (dependencyName === 'react-native' && /^https?:\/\//.test(dependencies[dependencyName])) {
            // TODO(@tsapeta): Find the newest version for given major SDK version number.
            targetVersion = `https://github.com/expo/react-native/archive/sdk-${sdkVersion}.tar.gz`;
          }
          if (targetVersion) {
            console.log(chalk.yellow('>'), `Updating ${chalk.blue(dependencyName)} to ${chalk.cyan(targetVersion)}...`);
            await JsonFile.setAsync(packageJsonPath, `${dependencyKey}.${dependencyName}`, targetVersion);
          }
        }
      }
    }

    if (sdkVersion && await fs.exists(appJsonPath)) {
      console.log(chalk.yellow('>'), `Setting SDK version to ${chalk.cyan(sdkVersion)}...`);
      await JsonFile.setAsync(appJsonPath, 'expo.sdkVersion', sdkVersion);
    }

    console.log(chalk.yellow('>'), 'Yarning...');

    const yarnLockPath = path.join(template.path, 'yarn.lock');

    if (await fs.exists(yarnLockPath)) {
      // We do want to always install the newest possible versions that match bundledNativeModules versions,
      // so let's remove yarn.lock before updating re-yarning dependencies.
      await fs.remove(yarnLockPath);
    }

    await spawnAsync('yarn', [], {
      stdio: ['ignore', 'ignore', 'inherit'],
      cwd: template.path,
      env: process.env,
    });

    console.log();
  }
}

export default (program: Command) => {
  program
    .command('update-project-templates')
    .alias('update-templates', 'upt')
    .description('Updates dependencies of project templates to the versions that are defined in `bundledNativeModules.json` file.')
    .option('-s, --sdkVersion [string]', 'SDK version for which the project templates should be updated. Defaults to the newest SDK version.')
    .asyncAction(action);
};
