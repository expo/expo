import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import Table from 'cli-table3';
import semver from 'semver';

import { VendoringTargetModulesConfig } from './types';
import { EXPO_GO_DIR } from '../Constants';
import { link } from '../Formatter';
import logger from '../Logger';
import * as Npm from '../Npm';
import { getBundledVersionsAsync } from '../ProjectVersions';

/**
 * Outputs a table with modules, their versions and status.
 */
export async function listAvailableVendoredModulesAsync(
  modules: VendoringTargetModulesConfig,
  onlyOutdated: boolean = false
) {
  const autolinkedModules = await listExpoGoAutoLinkingModulesAsync();
  const bundledNativeModules = { ...(await getBundledVersionsAsync()), ...autolinkedModules };
  const vendoredPackageNames = [...Object.keys(modules), ...Object.keys(autolinkedModules)];
  const packageViews: Npm.PackageViewType[] = await Promise.all(
    vendoredPackageNames.map((packageName: string) => Npm.getPackageViewAsync(packageName))
  );

  const table = new Table({
    head: ['Package name', 'Bundled', 'Latest', 'Up to date'],
    colAligns: ['right', 'center', 'center', 'center'],
  });

  for (const packageName of vendoredPackageNames) {
    const packageView = packageViews.shift();

    if (!packageView) {
      logger.error(`Couldn't get package view for ${chalk.green.bold(packageName)}.\n`);
      continue;
    }

    const bundledVersion = bundledNativeModules[packageName];
    const latestVersion = packageView['dist-tags'].latest;
    const isOutdated = !bundledVersion || semver.gtr(latestVersion, bundledVersion);

    if (!onlyOutdated || isOutdated) {
      let source: string;
      if (packageName in modules) {
        source = modules[packageName].source;
      } else {
        source = `https://www.npmjs.com/package/${packageName}`;
      }

      table.push([
        link(chalk.bold.green(packageName), source),
        (bundledVersion ? chalk.cyan : chalk.gray)(bundledVersion),
        chalk.cyan(latestVersion),
        isOutdated ? '❌' : '✅',
      ]);
    }
  }
  logger.log(table.toString());
}

/**
 * Lists all modules that are linked with Expo Go.
 * @returns Object with module names as keys and their versions as values.
 */
async function listExpoGoAutoLinkingModulesAsync(): Promise<Record<string, string>> {
  const { stdout } = await spawnAsync(
    'npx',
    ['expo-modules-autolinking', 'react-native-config', '--json'],
    {
      cwd: EXPO_GO_DIR,
    }
  );
  const { dependencies } = JSON.parse(stdout);
  const result = {};
  for (const [moduleName, moduleInfo] of Object.entries<Record<string, any>>(dependencies)) {
    if (moduleName === 'expo') {
      // Skip Expo package since it's not vendored.
      continue;
    }
    const packageRoot = moduleInfo.root;
    const { version } = require(`${packageRoot}/package.json`);
    result[moduleName] = version;
  }
  return result;
}
