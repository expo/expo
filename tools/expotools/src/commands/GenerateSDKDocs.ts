import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path.join(DOCS_DIR, 'pages', 'versions');
const STATIC_EXAMPLES_DIR = path.join(DOCS_DIR, 'static', 'examples');

async function action(options) {
  const { sdk, updateReactNativeDocs } = options;

  if (!sdk) {
    throw new Error('Must run with `--sdk SDK_VERSION`.');
  }

  if (updateReactNativeDocs) {
    const reactNativeWebsiteDir = path.join(DOCS_DIR, 'react-native-website');
    const reactNativePackageJsonPath = path.join(
      EXPO_DIR,
      'react-native-lab',
      'react-native',
      'package.json'
    );
    const reactNativeVersion = await JsonFile.getAsync(reactNativePackageJsonPath, 'version', null);

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
  const targetExampleDirectory = path.join(STATIC_EXAMPLES_DIR, `v${sdk}`);

  console.log(`\nSetting version ${chalk.red(sdk)} in ${chalk.yellow('package.json')}...`);

  await JsonFile.setAsync(path.join(DOCS_DIR, 'package.json'), 'version', sdk);

  if (await fs.pathExists(targetSdkDirectory)) {
    console.log(chalk.magenta(`v${sdk}`), 'directory already exists. Skipping copy operation.');
  } else {
    console.log(
      `Copying ${chalk.yellow('unversioned')} docs to ${chalk.yellow(`v${sdk}`)} directory...`
    );

    await fs.copy(path.join(SDK_DOCS_DIR, 'unversioned'), targetSdkDirectory);
  }

  if (await fs.pathExists(targetExampleDirectory)) {
    console.log(
      chalk.magenta(`v${sdk}`),
      'examples directory already exists. Skipping copy operation.'
    );
  } else {
    console.log(
      `Copying ${chalk.yellow('unversioned')} static examples to ${chalk.yellow(
        `v${sdk}`
      )} directory...`
    );

    await fs.copy(path.join(STATIC_EXAMPLES_DIR, 'unversioned'), targetExampleDirectory);
  }
}

export default program => {
  program
    .command('generate-sdk-docs')
    .option('--sdk <string>', 'SDK version of docs to generate.')
    .option('--update-react-native-docs', 'Whether to update React Native docs.')
    .description(`Copies unversioned docs and static examples to SDK-specific folder.`)
    .asyncAction(action);
};
