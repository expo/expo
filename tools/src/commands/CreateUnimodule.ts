import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import * as path from 'path';

import { PACKAGES_DIR, EXPO_DIR } from '../Constants';
import { spawnAsync } from '../Utils';
import generateModuleAsync from '../generate-module/generateModuleAsync';

type ActionOptions = {
  name: string;
  template?: string;
  useLocalTemplate?: boolean;
};

async function setupExpoModuleScripts(unimoduleDirectory) {
  const packageJsonPath = path.join(unimoduleDirectory, 'package.json');
  const packageJson = new JsonFile(packageJsonPath);
  const moduleScriptsVersion = (await JsonFile.getAsync(
    path.join(PACKAGES_DIR, 'expo-module-scripts', 'package.json'),
    'version',
    ''
  )) as string;

  console.log(`Installing ${chalk.bold.green('expo-module-scripts')}...`);

  await spawnAsync('yarn', ['add', '--dev', `expo-module-scripts@^${moduleScriptsVersion}`], {
    cwd: unimoduleDirectory,
  });

  console.log(`Setting up ${chalk.magenta(path.relative(EXPO_DIR, packageJsonPath))}...`);

  await packageJson.setAsync('scripts', {
    build: 'expo-module build',
    clean: 'expo-module clean',
    lint: 'expo-module lint',
    test: 'expo-module test',
    prepare: 'expo-module prepare',
    prepublishOnly: 'expo-module prepublishOnly',
    'expo-module': 'expo-module',
  });

  await packageJson.setAsync('repository', {
    type: 'git',
    url: 'https://github.com/expo/expo.git',
    directory: path.relative(EXPO_DIR, unimoduleDirectory),
  });

  await packageJson.setAsync('bugs', {
    url: 'https://github.com/expo/expo/issues',
  });

  await packageJson.setAsync('jest', {
    preset: 'expo-module-scripts/ios',
  });

  // `expo generate-module` left some junk fields in package.json
  // TODO(@tsapeta): Probably these keys should be deleted by CLI, but I'd like to do this separately since it needs some other changes as well.
  await packageJson.deleteKeysAsync(['gitHead', '_resolved', '_integrity', '_from']);
}

async function action(options: ActionOptions) {
  if (!options.name) {
    throw new Error('Missing unimodule name. Run with `--name <string>`.');
  }

  const unimoduleDirectory = path.join(PACKAGES_DIR, options.name);

  await generateModuleAsync(unimoduleDirectory, options);

  await setupExpoModuleScripts(unimoduleDirectory);
}

export default (program: Command) => {
  program
    .command('create-unimodule')
    .alias('cu')
    .description('Creates a new unimodule under the `packages` folder.')
    .option('-n, --name <string>', 'Name of the package to create.', null)
    .option(
      '--use-local-template',
      'Uses local `packages/expo-module-template` instead of the one published to NPM. Ignored when -t option is used.'
    )
    .option(
      '-t, --template <string>',
      'Local directory or npm package containing template for unimodule'
    )
    .asyncAction(action);
};
