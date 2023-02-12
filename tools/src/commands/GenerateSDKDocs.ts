import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import { transformFileAsync } from '../Transforms';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path.join(DOCS_DIR, 'pages', 'versions');
const STATIC_EXAMPLES_DIR = path.join(DOCS_DIR, 'public', 'static', 'examples');
const STATIC_API_DATA_DIR = path.join(DOCS_DIR, 'public', 'static', 'data');

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

    await spawnAsync('git', ['checkout', 'main'], {
      cwd: reactNativeWebsiteDir,
    });

    await spawnAsync('git', ['pull'], {
      cwd: reactNativeWebsiteDir,
    });

    console.log(`Importing React Native docs to ${chalk.yellow('unversioned')} directory...\n`);

    await fs.remove(path.join(SDK_DOCS_DIR, 'unversioned', 'react-native'));

    await spawnAsync('et', ['update-react-native-docs', '--sdk', 'unversioned'], {
      stdio: 'inherit',
      cwd: DOCS_DIR,
    });
  }

  const versionDirectory = `v${sdk}`;
  const targetSdkDirectory = path.join(SDK_DOCS_DIR, versionDirectory);
  const targetExampleDirectory = path.join(STATIC_EXAMPLES_DIR, versionDirectory);
  const targetAPIDataDirectory = path.join(STATIC_API_DATA_DIR, versionDirectory);

  if (await fs.pathExists(targetSdkDirectory)) {
    console.log(
      chalk.magenta(versionDirectory),
      'directory already exists. Skipping copy operation.'
    );
  } else {
    console.log(
      `Copying ${chalk.yellow('unversioned')} docs to ${chalk.yellow(
        versionDirectory
      )} directory...`
    );

    await fs.copy(path.join(SDK_DOCS_DIR, 'unversioned'), targetSdkDirectory);

    // Version the sourcecode URLs for the API pages
    const apiPages = await fs.readdir(path.join(targetSdkDirectory, 'sdk'));
    await Promise.all(
      apiPages.map(async (api) => {
        const apiFilePath = path.join(targetSdkDirectory, 'sdk', api);
        await transformFileAsync(apiFilePath, [
          {
            find: /(sourceCodeUrl:.*?\/tree\/)(main)(\/packages[^\n]*)/,
            replaceWith: `$1sdk-${sdk.substring(0, 2)}$3`,
          },
        ]);
      })
    );
  }

  if (await fs.pathExists(targetExampleDirectory)) {
    console.log(
      chalk.magenta(versionDirectory),
      'examples directory already exists. Skipping copy operation.'
    );
  } else {
    console.log(
      `Copying ${chalk.yellow('unversioned')} static examples to ${chalk.yellow(
        versionDirectory
      )} directory…`
    );

    await fs.copy(path.join(STATIC_EXAMPLES_DIR, 'unversioned'), targetExampleDirectory);
  }

  if (await fs.pathExists(targetAPIDataDirectory)) {
    console.log(
      chalk.magenta(versionDirectory),
      'API data directory already exists. Skipping copy operation.'
    );
  } else {
    console.log(
      `Copying ${chalk.yellow('unversioned')} generated API files to ${chalk.yellow(
        versionDirectory
      )} directory…`
    );

    await fs.copy(path.join(STATIC_API_DATA_DIR, 'unversioned'), targetAPIDataDirectory);
  }

  console.log(
    `\nDocs version ${chalk.red(
      sdk
    )} created successfully. By default, it will not be included in the production build.` +
      `\nWhen the new version is ready to deploy, set version to ${chalk.red(
        sdk
      )} in ${chalk.yellow('docs/package.json')}`
  );
}

export default (program) => {
  program
    .command('generate-sdk-docs')
    .option('--sdk <string>', 'SDK version of docs to generate.')
    .option('--update-react-native-docs', 'Whether to update React Native docs.')
    .description(`Copies unversioned docs and static examples to SDK-specific folder.`)
    .asyncAction(action);
};
