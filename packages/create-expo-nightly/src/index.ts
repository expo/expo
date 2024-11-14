#!/usr/bin/env node

import './Preclude.fx.js';

import chalk from 'chalk';
import { Command } from 'commander';
import path from 'node:path';

import { packExpoBareTemplateTarballAsync } from './ExpoRepo.js';
import { getNpmVersionAsync } from './Npm.js';
import {
  addWorkspacePackagesToAppAsync,
  getExpoPackagesAsync,
  reinstallPackagesAsync,
} from './Packages.js';
import { setDefaultVerbose } from './Processes.js';
import {
  type ProjectProperties,
  createExpoApp,
  installCocoaPodsAsync,
  prebuildAppAsync,
} from './Project.js';
import { checkRequiredToolsAsync } from './SanityChecks.js';
import packageJSON from '../package.json' assert { type: 'json' };

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .description('Create an app for react-native nightlies testing.')
  .argument('[path]', 'The output path for the app.', '.')
  .option('--name <name>', 'The name of the app to create.', 'test-nightlies')
  .option(
    '--expo-repo <path>',
    'The path to the expo repository. (default: Cloning to the "expo" directory in the output app)'
  )
  .option('-v, --verbose', 'Verbose output.')
  .option(
    '--app-id <name>',
    'The Android applicationId and iOS bundleIdentifier.',
    'dev.expo.testnightlies'
  )
  .option('--no-install', 'Skip installing CocoaPods.')
  .option('--enable-new-architecture', 'Enable the New Architecture mode.')
  .parse(process.argv);

async function runAsync(programName: string) {
  const programOpts = program.opts();
  setDefaultVerbose(!!programOpts.verbose);
  await checkRequiredToolsAsync(['bun', 'git', 'npm', 'yarn']);

  const projectName = programOpts.name;
  const projectRoot = path.join(path.resolve(program.args[0] || '.'), projectName);
  const nightlyVersion = await getNpmVersionAsync('react-native', 'nightly');
  const projectProps: ProjectProperties = {
    appId: programOpts.appId,
    newArchEnabled: !!programOpts.enableNewArchitecture,
    nightlyVersion,
    useExpoRepoPath: programOpts.expoRepo,
  };
  console.log(
    chalk.cyan(
      `Setting up app at ${chalk.bold(projectRoot)} with ${chalk.bold(
        'react-native@' + nightlyVersion
      )}`
    )
  );
  const expoRepoPath = await createExpoApp(projectRoot, projectProps);

  const packages = await getExpoPackagesAsync(expoRepoPath);

  await addWorkspacePackagesToAppAsync(projectRoot, packages);

  console.log(chalk.cyan(`Reinstalling packages`));
  await reinstallPackagesAsync(projectRoot);

  console.log(chalk.cyan(`Running prebuild`));
  const tarballPath = await packExpoBareTemplateTarballAsync(
    expoRepoPath,
    path.join(projectRoot, '.expo')
  );
  await prebuildAppAsync(projectRoot, tarballPath);

  if (programOpts.install) {
    if (process.platform === 'darwin') {
      await checkRequiredToolsAsync(['pod']);
      console.log(`Installing CocoaPods dependencies`);
      console.time('Installed CocoaPods dependencies');
      await installCocoaPodsAsync(projectRoot);
      console.timeEnd('Installed CocoaPods dependencies');
    }
  }
}

(async () => {
  program.parse(process.argv);
  try {
    await runAsync(packageJSON.name);
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
