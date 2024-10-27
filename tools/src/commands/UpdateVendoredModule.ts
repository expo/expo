import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import { runReactNativeCodegenAsync } from '../Codegen';
import { EXPO_DIR } from '../Constants';
import { GitDirectory } from '../Git';
import logger from '../Logger';
import { downloadPackageTarballAsync } from '../Npm';
import { PackageJson } from '../Packages';
import { updateBundledVersionsAsync } from '../ProjectVersions';
import * as Workspace from '../Workspace';
import {
  getVendoringAvailablePlatforms,
  listAvailableVendoredModulesAsync,
  vendorPlatformAsync,
} from '../vendoring';
import vendoredModulesConfig from '../vendoring/config';
import { legacyVendorModuleAsync } from '../vendoring/legacy';
import { VendoringModuleConfig, VendoringTargetConfig } from '../vendoring/types';

type ActionOptions = {
  list: boolean;
  listOutdated: boolean;
  target: string;
  module: string;
  platform: string;
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
      '-p, --platform <string>',
      'A platform on which the vendored module will be updated.',
      'all'
    )
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

    const platforms = resolvePlatforms(options.platform);

    for (const platform of platforms) {
      if (!targetConfig.platforms[platform]) {
        continue;
      }
      await runCodegenIfNeeded(sourceDirectory, moduleConfig, platform);

      // TODO(@tsapeta): Remove this once all vendored modules are migrated to the new system.
      if (!targetConfig.modules[moduleName][platform]) {
        // If the target doesn't support this platform, maybe legacy vendoring does.
        logger.info('‼️  Using legacy vendoring for platform %s', chalk.yellow(platform));
        await legacyVendorModuleAsync(moduleName, platform, sourceDirectory);
        continue;
      }

      const targetDirectory = path.join(
        targetConfig.platforms[platform].targetDirectory,
        moduleName
      );
      logger.log(
        '🎯 Vendoring for %s to %s',
        chalk.yellow(platform),
        chalk.magenta(targetDirectory)
      );

      // Clean up previous version
      await fs.remove(targetDirectory);

      // Delegate further steps to platform's provider
      await vendorPlatformAsync(platform, sourceDirectory, targetDirectory, moduleConfig[platform]);
    }

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

function resolvePlatforms(platform: string): string[] {
  const all = getVendoringAvailablePlatforms();
  return all.includes(platform) ? [platform] : all;
}

async function runCodegenIfNeeded(
  sourceDirectory: string,
  moduleConfig: VendoringModuleConfig,
  platform: string
) {
  const packageJsonPath = path.join(
    sourceDirectory,
    moduleConfig.packageJsonPath ?? 'package.json'
  );
  const packageJson = require(packageJsonPath) as PackageJson;
  const libs = packageJson?.codegenConfig?.libraries ?? [];
  const fabricDisabledLibs = libs.filter((lib) => lib.type !== 'components');
  if (!fabricDisabledLibs.length) {
    return;
  }
  if (platform !== 'android' && platform !== 'ios') {
    throw new Error(`Unsupported platform - ${platform}`);
  }

  const reactNativeRoot = path.join(EXPO_DIR, 'react-native-lab', 'react-native');
  const codegenPkgRoot = path.join(reactNativeRoot, 'packages', 'react-native-codegen');

  await Promise.all(
    fabricDisabledLibs.map((lib) =>
      runReactNativeCodegenAsync({
        reactNativeRoot,
        codegenPkgRoot,
        outputDir: path.join(sourceDirectory, platform),
        name: lib.name,
        type: lib.type,
        platform,
        jsSrcsDir: path.join(sourceDirectory, lib.jsSrcsDir),
      })
    )
  );
}
