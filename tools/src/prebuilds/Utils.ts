import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';

import logger from '../Logger';
import { getPackageByName, Package } from '../Packages';
import { SPMProduct } from './SPMConfig.types';

/**
 * Verifies that all requested packages exist and have spm-config.json files.
 * @param packageNames Names of packages to verify
 * @returns Parsed Packages that were verified
 */
export const verifyPackagesAsync = async (packageNames: string[]): Promise<Package[]> => {
  return Promise.all(
    packageNames.map(async (name) => {
      // Does it have a folder in packages/?
      const pkg = getPackageByName(name);
      if (!pkg) {
        throw new Error(`Package not found: ${chalk.red(name)}`);
      }
      // Does it have a prebuild.config.json file?
      if (!pkg.hasSwiftPMConfiguration()) {
        throw new Error(`Package ${chalk.gray(name)} does not have a spm.config.json file.`);
      }

      return pkg;
    })
  );
};

/**
 * Tries to resolve versions for React Native and Hermes.
 * @param options Options containing optional versions if none is found.
 * @returns Resolved versions for React Native and Hermes
 */
export const getVersionsInfoAsync = async (options: {
  reactNativeVersion?: string;
  hermesVersion?: string;
}): Promise<{
  reactNativeVersion: string;
  hermesVersion: string;
}> => {
  const rootPackageJson = await fs.readJSON(
    path.join(__dirname, '../../../apps/bare-expo/package.json')
  );

  const reactNativeVersion =
    options.reactNativeVersion || rootPackageJson.dependencies?.['react-native'] || 'nightly';

  // Hermes version must be provided explicitly since it uses different versioning than React Native
  // Check node_modules/react-native/sdks/.hermesversion for the correct version
  const hermesVersion = options.hermesVersion;
  if (!hermesVersion) {
    throw new Error(
      `Hermes version is required. Check node_modules/react-native/sdks/.hermesversion for the correct version.\n   Example: et prebuild-packages --hermes-version 0.14.0 expo-modules-core`
    );
  }

  return {
    reactNativeVersion,
    hermesVersion,
  };
};

/**
 * Verifies that provided local tarball paths exist if they are set in the option arguments
 * @param options Options containing optional tarball paths
 */
export const verifyLocalTarballPathsIfSetAsync = async (options: {
  reactNativeTarballPath?: string;
  hermesTarballPath?: string;
  reactNativeDependenciesTarballPath?: string;
}): Promise<void> => {
  if (options.reactNativeTarballPath && !(await fs.exists(options.reactNativeTarballPath))) {
    throw new Error(
      `React Native tarball path does not exist: ${chalk.gray(options.reactNativeTarballPath)}`
    );
  }
  if (options.hermesTarballPath && !(await fs.exists(options.hermesTarballPath))) {
    throw new Error(`Hermes tarball path does not exist: ${chalk.gray(options.hermesTarballPath)}`);
  }
  if (
    options.reactNativeDependenciesTarballPath &&
    !(await fs.exists(options.reactNativeDependenciesTarballPath))
  ) {
    throw new Error(
      `React Native Dependencies tarball path does not exist: ${chalk.gray(
        options.reactNativeDependenciesTarballPath
      )}`
    );
  }
};

const Prefix = '  ';
const getPackageAndProductPrefix = (
  colorizer: (...text: unknown[]) => string,
  pkg?: Package,
  product?: SPMProduct
) => {
  return pkg
    ? `[${colorizer(pkg.packageName)}${product ? '/' + colorizer(product.name) : ''}] `
    : '';
};

export const createAsyncSpinner = (initialText: string, pkg?: Package, product?: SPMProduct) => {
  if (process.env.CI != null || process.stdout.isTTY === false) {
    return {
      succeed: (text?: string) => {
        logger.log(
          `${Prefix} ${chalk.green('✔')} ${getPackageAndProductPrefix(chalk.green, pkg, product)}${text ?? ''}`
        );
      },
      fail: (text?: string) => {
        logger.log(
          `${Prefix} ${chalk.red('✖')} ${getPackageAndProductPrefix(chalk.red, pkg, product)}${text ?? ''}`
        );
      },
      warn: (text?: string) => {
        logger.log(
          `${Prefix} ${chalk.yellow('⚠')} ${getPackageAndProductPrefix(chalk.yellow, pkg, product)}${text ?? ''}`
        );
      },
      info: (text?: string) => {
        logger.log(
          `${Prefix} ${chalk.blue('ℹ')} ${getPackageAndProductPrefix(chalk.green, pkg, product)}${text ?? ''}`
        );
      },
    };
  }
  const spinner = ora({
    prefixText: Prefix,
    text: (pkg ? `[${chalk.green(pkg.packageName)}] ` : '') + initialText,
  }).start();
  return {
    succeed: (text?: string) =>
      spinner.succeed(
        (pkg ? `${getPackageAndProductPrefix(chalk.green, pkg, product)}` : '') + (text ?? '')
      ),
    fail: (text?: string) =>
      spinner.fail(
        (pkg ? `${getPackageAndProductPrefix(chalk.red, pkg, product)}` : '') + (text ?? '')
      ),
    warn: (text?: string) =>
      spinner.warn(
        (pkg ? `${getPackageAndProductPrefix(chalk.yellow, pkg, product)}` : '') + (text ?? '')
      ),
    info: (text: string) =>
      (spinner.text =
        (pkg ? `${getPackageAndProductPrefix(chalk.green, pkg, product)}` : '') + text),
  };
};

export type AsyncSpinner = ReturnType<typeof createAsyncSpinner>;

/**
 * Error that also fails the spinner when thrown.
 */
export class SpinnerError extends Error {
  constructor(message: string, spinner: AsyncSpinner) {
    super(message);
    this.name = message;
    spinner.fail(message);
  }
}
