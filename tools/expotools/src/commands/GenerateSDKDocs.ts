import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path.join(DOCS_DIR, 'pages', 'versions');

async function action(options) {
  const { sdk, updateReactNativeDocs } = options;

  if (!sdk) {
    throw new Error('Must run with `--sdk SDK_VERSION`.');
  }

  if (updateReactNativeDocs) {
    const reactNativeWebsiteDir = path.join(DOCS_DIR, 'react-native-website');
    const reactNativePackageJsonPath = path.join(EXPO_DIR, 'react-native-lab', 'react-native', 'package.json');
    const reactNativeVersion = await JsonFile.getAsync(
      reactNativePackageJsonPath,
      'version',
      null,
    );

    if (!reactNativeVersion) {
      throw new Error(`React Native version not found at ${reactNativePackageJsonPath}`);
    }

    console.log(`Updating ${chalk.cyan('react-native-website')} submodule...`);

    await spawnAsync('git', ['checkout', 'master'], {
      cwd: reactNativeWebsiteDir,
    });

    await spawnAsync('git', ['pull'], {
      cwd: reactNativeWebsiteDir,
    });

    console.log(`Importing React Native docs to ${chalk.yellow('unversioned')} directory...\n`);

    await fs.remove(path.join(SDK_DOCS_DIR, 'unversioned', 'react-native'));

    await spawnAsync('yarn', ['run', 'import-react-native-docs'], {
      stdio: 'inherit',
      cwd: DOCS_DIR,
    });
  }

  const targetSdkDirectory = path.join(SDK_DOCS_DIR, `v${sdk}`);

  console.log(`\nSetting version ${chalk.red(sdk)} in ${chalk.yellow('package.json')}...`);

  await JsonFile.setAsync(
    path.join(DOCS_DIR, 'package.json'),
    'version',
    sdk,
  );

  if (await fs.exists(targetSdkDirectory)) {
    const { result } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'result',
        message: `Docs version ${chalk.magenta(`v${sdk}`)} already exists. Do you want to override?`,
        default: true,
      },
    ]);

    if (result) {
      await fs.remove(targetSdkDirectory);
    } else {
      console.log(chalk.grey('Skipped copying React Native docs.'));
      return process.exit(0);
    }
  }

  console.log(`Copying ${chalk.yellow('unversioned')} docs to ${chalk.yellow(`v${sdk}`)} directory...`);

  await fs.copy(
    path.join(SDK_DOCS_DIR, 'unversioned'),
    targetSdkDirectory,
  );
}

export default program => {
  program
    .command('generate-sdk-docs')
    .option('--sdk <string>', 'SDK version of docs to generate.')
    .option('--update-react-native-docs', 'Whether to update React Native docs.')
    .description(`Copies unversioned docs to SDK-specific folder.`)
    .asyncAction(action);
};
