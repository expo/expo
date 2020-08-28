import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { PACKAGES_DIR, EXPO_DIR } from '../Constants';
import { spawnAsync } from '../Utils';

type ActionOptions = {
  name: string;
  template?: string;
  useLocalTemplate?: boolean;
};

const TEMPLATE_PACKAGE_NAME = 'expo-module-template';

async function generateModuleWithExpoCLI(
  unimoduleDirectory: string,
 { template, useLocalTemplate }: Pick<ActionOptions, 'template' | 'useLocalTemplate'>
) {
  console.log(
    `Creating new unimodule under ${chalk.magenta(path.relative(EXPO_DIR, unimoduleDirectory))}...`
  );

  const templateParams: string[] = [];

  if (template) {
    console.log(`Using custom module template: ${chalk.blue(template)}`);

    templateParams.push('--template', template);
  } else if (useLocalTemplate) {
    const templatePath = path.join(PACKAGES_DIR, TEMPLATE_PACKAGE_NAME);

    console.log(
      `Using local module template from ${chalk.blue(path.relative(EXPO_DIR, templatePath))}`
    );

    templateParams.push('--template', templatePath);
  }

  await spawnAsync('expo', ['generate-module', ...templateParams, unimoduleDirectory], {
    stdio: 'inherit',
  });
}

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

  await generateModuleWithExpoCLI(unimoduleDirectory, options);

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
