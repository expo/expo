import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import { EXPO_GO_LOCAL_MODULES_DIR } from '../Constants';
import { GitDirectory } from '../Git';
import logger from '../Logger';
import { downloadPackageTarballAsync } from '../Npm';
import { PackageJson } from '../Packages';
import { updateBundledVersionsAsync } from '../ProjectVersions';
import { searchFilesAsync } from '../Utils';
import * as Workspace from '../Workspace';
import { listAvailableVendoredModulesAsync } from '../vendoring';
import { copyVendoredFilesAsync } from '../vendoring/common';
import vendoredModulesConfig from '../vendoring/config';
import { VendoringModuleConfig, VendoringTargetConfig } from '../vendoring/types';

type ActionOptions = {
  list: boolean;
  listOutdated: boolean;
  target: string;
  module: string;
  commit: string;
  semverPrefix: string;
  updateDependencies?: boolean;
};

const EXPO_GO_TARGET = 'expo-go';

export default (program: Command) => {
  program
    .command('update-vendored-module')
    .alias('update-module', 'uvm')
    .description('Updates 3rd party modules.')
    .option('-l, --list', 'Shows a list of available 3rd party modules.', false)
    .option('-o, --list-outdated', 'Shows a list of outdated 3rd party modules.', false)
    .option(
      '-t, --target <string>',
      'The target to update, e.g. Expo Go or development client.',
      EXPO_GO_TARGET
    )
    .option('-m, --module <string>', 'Name of the module to update.')
    .option(
      '-c, --commit <string>',
      'Git reference on which to checkout when copying 3rd party module.',
      'master'
    )
    .option(
      '-s, --semver-prefix <string>',
      'Setting this flag forces to use given semver prefix. Some modules may specify them by the config, but in case we want to update to alpha/beta versions we should use an empty prefix to be more strict.',
      null
    )
    .option(
      '-u, --update-dependencies',
      'Whether to update workspace dependencies and bundled native modules.',
      true
    )
    .asyncAction(action);
};

async function action(options: ActionOptions) {
  const target = await resolveTargetNameAsync(options.target);
  const targetConfig = vendoredModulesConfig[target];

  if (options.list || options.listOutdated) {
    if (target !== EXPO_GO_TARGET) {
      throw new Error(`Listing vendored modules for target "${target}" is not supported.`);
    }
    await listAvailableVendoredModulesAsync(targetConfig.modules, options.listOutdated);
    return;
  }

  const moduleName = await resolveModuleNameAsync(options.module, targetConfig);
  const downloadSourceDir = path.join(os.tmpdir(), 'ExpoVendoredModules', moduleName);
  const moduleConfig = targetConfig.modules[moduleName];

  try {
    await downloadSourceAsync(downloadSourceDir, moduleName, moduleConfig, options);
    const sourceDirectory = moduleConfig.rootDir
      ? path.join(downloadSourceDir, moduleConfig.rootDir)
      : downloadSourceDir;
    const targetDirectory = path.join(EXPO_GO_LOCAL_MODULES_DIR, moduleName);

    // Clean up previous version
    await fs.remove(targetDirectory);

    // Copy files from the source to the target
    const files = await searchFilesAsync(sourceDirectory, '**/*', {
      ignore: ['*.tgz', ...(moduleConfig.excludeFiles ?? [])],
    });
    await copyVendoredFilesAsync(files, {
      sourceDirectory,
      targetDirectory,
      transforms: moduleConfig.transforms ?? {},
    });

    // Run post hook
    await moduleConfig.postCopyFilesHookAsync?.(sourceDirectory, targetDirectory);

    // Update dependency versions only for Expo Go target.
    if (options.updateDependencies !== false && target === EXPO_GO_TARGET) {
      const packageJsonPath = path.join(
        sourceDirectory,
        moduleConfig.packageJsonPath ?? 'package.json'
      );
      const packageJson = require(packageJsonPath) as PackageJson;
      const semverPrefix =
        (options.semverPrefix != null ? options.semverPrefix : moduleConfig.semverPrefix) || '';
      const newVersionRange = `${semverPrefix}${packageJson.version}`;

      await updateDependenciesAsync(moduleName, newVersionRange);
    }
  } finally {
    // Clean cloned repo
    await fs.remove(downloadSourceDir);
  }
  logger.success('💪 Successfully updated %s\n', chalk.bold(moduleName));
}

/**
 * Downloads vendoring module source code either from git repository or npm
 */
async function downloadSourceAsync(
  sourceDirectory: string,
  moduleName: string,
  moduleConfig: VendoringModuleConfig,
  options: ActionOptions
) {
  if (moduleConfig.sourceType === 'npm') {
    const version = options.commit ?? 'latest';
    logger.log('📥 Downloading %s@%s from npm', chalk.green(moduleName), chalk.cyan(version));

    const tarball = await downloadPackageTarballAsync(
      sourceDirectory,
      moduleConfig.source,
      version
    );
    // `--strip-component 1` to extract files from package/ folder
    await spawnAsync('tar', ['--strip-component', '1', '-xf', tarball], { cwd: sourceDirectory });
    return;
  }

  // Clone repository from the source
  logger.log(
    '📥 Cloning %s#%s from %s',
    chalk.green(moduleName),
    chalk.cyan(options.commit),
    chalk.magenta(moduleConfig.source)
  );

  await GitDirectory.shallowCloneAsync(
    sourceDirectory,
    moduleConfig.source,
    options.commit ?? 'master'
  );
}

/**
 * Updates versions in bundled native modules and workspace projects.
 */
async function updateDependenciesAsync(moduleName: string, versionRange: string) {
  logger.log('✍️  Updating bundled native modules');

  await updateBundledVersionsAsync({
    [moduleName]: versionRange,
  });

  logger.log('✍️  Updating workspace dependencies');

  await Workspace.updateDependencyAsync(moduleName, versionRange);
}

/**
 * Validates provided target name or prompts for the valid one.
 */
async function resolveTargetNameAsync(providedTargetName: string): Promise<string> {
  const targets = Object.keys(vendoredModulesConfig);

  if (providedTargetName) {
    if (targets.includes(providedTargetName)) {
      return providedTargetName;
    }
    throw new Error(`Couldn't find config for ${providedTargetName} target.`);
  }
  const { targetName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetName',
      prefix: '❔',
      message: 'In which target do you want to update vendored module?',
      choices: targets.map((target) => ({
        name: vendoredModulesConfig[target].name,
        value: target,
      })),
    },
  ]);
  return targetName;
}

/**
 * Validates provided module name or prompts for the valid one.
 */
async function resolveModuleNameAsync(
  providedModuleName: string,
  targetConfig: VendoringTargetConfig
): Promise<string> {
  const moduleNames = Object.keys(targetConfig.modules);

  if (providedModuleName) {
    if (moduleNames.includes(providedModuleName)) {
      return providedModuleName;
    }
    throw new Error(`Couldn't find config for ${providedModuleName} module.`);
  }
  const { moduleName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'moduleName',
      prefix: '❔',
      message: 'Which vendored module do you want to update?',
      choices: moduleNames,
    },
  ]);
  return moduleName;
}
