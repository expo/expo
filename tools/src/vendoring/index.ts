import chalk from 'chalk';
import Table from 'cli-table3';
import semver from 'semver';

import { link } from '../Formatter';
import logger from '../Logger';
import * as Npm from '../Npm';
import { getBundledVersionsAsync } from '../ProjectVersions';
import {
  VendoringModulePlatformConfig,
  VendoringProvider,
  VendoringTargetModulesConfig,
} from './types';

const VENDORING_PROVIDERS: Record<string, () => VendoringProvider> = {
  ios: () => require('../vendoring/IosVendoring'),
  android: () => require('../vendoring/AndroidVendoring'),
};

/**
 * Delegates vendoring process to platform's provider.
 */
export async function vendorPlatformAsync(
  platform: string,
  sourceDirectory: string,
  targetDirectory: string,
  modulePlatformConfig?: VendoringModulePlatformConfig
) {
  const provider = VENDORING_PROVIDERS[platform]?.();

  if (!provider) {
    throw new Error(`No vendoring provider for platform "${platform}".`);
  }
  await provider.vendorAsync(sourceDirectory, targetDirectory, modulePlatformConfig);
}

/**
 * Outputs a table with modules, their versions and status.
 */
export async function listAvailableVendoredModulesAsync(
  modules: VendoringTargetModulesConfig,
  onlyOutdated: boolean = false
) {
  const bundledNativeModules = await getBundledVersionsAsync();
  const vendoredPackageNames = Object.keys(modules);
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
      const { source } = modules[packageName];

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
 * Returns an array of platforms that vendoring process is available for.
 */
export function getVendoringAvailablePlatforms(): string[] {
  return Object.keys(VENDORING_PROVIDERS);
}
