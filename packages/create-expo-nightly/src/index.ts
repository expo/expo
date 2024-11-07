#!/usr/bin/env node

import './Preclude.fx.js';

import chalk from 'chalk';
import { Command } from 'commander';
import path from 'node:path';

import { packExpoBareTemplateTarballAsync, setupExpoRepoAsync } from './ExpoRepo.js';
import { getNpmVersionAsync } from './Npm.js';
import {
  addLinkablePackagesToAppAsync,
  getExpoPackagesAsync,
  getReactNativeTransitivePackagesAsync,
  registerPackageLinkingAsync,
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
  const projectProps: ProjectProperties = {
    appId: programOpts.appId,
    newArchEnabled: !!programOpts.enableNewArchitecture,
  };
  const expoRepoPath = programOpts.expoRepo ?? path.join(projectRoot, 'expo');
  const nightlyVersion = await getNpmVersionAsync('react-native', 'nightly');
  console.log(
    chalk.cyan(
      `Setting up app at ${chalk.bold(projectRoot)} with ${chalk.bold(
        'react-native@' + nightlyVersion
      )}`
    )
  );
  await createExpoApp(projectRoot, expoRepoPath, projectProps);
  await setupExpoRepoAsync(expoRepoPath, nightlyVersion);

  const packages = [
    ...(await getExpoPackagesAsync(expoRepoPath)),
    ...(await getReactNativeTransitivePackagesAsync(expoRepoPath)),
  ];

  console.log(chalk.cyan(`Registering bun links`));
  for (const pkg of packages) {
    console.log(`  ${pkg.name}`);
    await registerPackageLinkingAsync(expoRepoPath, pkg);
  }
  await addLinkablePackagesToAppAsync(projectRoot, packages);

  console.log(chalk.cyan(`Reinstalling packages`));
  await reinstallPackagesAsync(projectRoot);

  console.log(chalk.cyan(`Running prebuild`));
  const tarballPath = await packExpoBareTemplateTarballAsync(expoRepoPath, projectRoot);
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
