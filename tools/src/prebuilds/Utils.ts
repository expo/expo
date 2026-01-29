import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';

import logger from '../Logger';
import { getListOfPackagesAsync, getPackageByName, Package } from '../Packages';
import { SPMProduct } from './SPMConfig.types';

/**
 * Discovers all packages that have spm.config.json files.
 * @returns Array of Packages that have SPM configuration
 */
export const discoverPackagesWithSPMConfigAsync = async (): Promise<Package[]> => {
  const allPackages = await getListOfPackagesAsync();
  return allPackages.filter((pkg) => pkg.hasSwiftPMConfiguration());
};

/**
 * Verifies that all requested packages exist and have spm-config.json files.
 * If no package names are provided, discovers all packages with spm.config.json.
 * @param packageNames Names of packages to verify (if empty, discovers all SPM packages)
 * @returns Parsed Packages that were verified
 */
export const verifyPackagesAsync = async (packageNames: string[]): Promise<Package[]> => {
  // If no package names provided, discover all packages with spm.config.json
  if (packageNames.length === 0) {
    const packages = await discoverPackagesWithSPMConfigAsync();
    if (packages.length === 0) {
      throw new Error('No packages with spm.config.json found in the packages directory.');
    }
    logger.info(
      `Discovered ${chalk.cyan(packages.length)} packages with spm.config.json: ${chalk.green(packages.map((p) => p.packageName).join(', '))}`
    );
    return packages;
  }

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

  const resolveReactNativePath = () => path.join(__dirname, '../../../node_modules/react-native');

  const readHermesTag = async (reactNativePath: string) => {
    const hermesTagPath = path.join(reactNativePath, 'sdks', '.hermesversion');
    if (!(await fs.exists(hermesTagPath))) {
      throw new Error('[Hermes] .hermesversion does not exist.');
    }
    const data = (await fs.readFile(hermesTagPath, 'utf8')).trim();
    if (!data) {
      throw new Error('[Hermes] .hermesversion file is empty.');
    }
    return data;
  };

  const readHermesV1Tag = async (reactNativePath: string) => {
    const hermesV1TagPath = path.join(reactNativePath, 'sdks', '.hermesv1version');
    if (!(await fs.exists(hermesV1TagPath))) {
      throw new Error('[Hermes] .hermesv1version does not exist.');
    }
    const data = (await fs.readFile(hermesV1TagPath, 'utf8')).trim();
    if (!data) {
      throw new Error('[Hermes] .hermesv1version file is empty.');
    }
    return data;
  };

  const readHermesVersionProperties = async (reactNativePath: string) => {
    const versionPropertiesPath = path.join(
      reactNativePath,
      'sdks/hermes-engine/version.properties'
    );
    if (!(await fs.exists(versionPropertiesPath))) {
      throw new Error('version.properties does not exist.');
    }
    const content = await fs.readFile(versionPropertiesPath, 'utf8');
    const properties: Record<string, string> = {};
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=');
        if (key && value) {
          properties[key.trim()] = value.trim();
        }
      }
    });
    return properties;
  };

  const resolveHermesVersionAsync = async (): Promise<string> => {
    const reactNativePath = resolveReactNativePath();
    const properties = await readHermesVersionProperties(reactNativePath);

    let classicTag: string | null = null;
    let v1Tag: string | null = null;

    try {
      classicTag = await readHermesTag(reactNativePath);
    } catch (error) {
      logger.warn(`Could not read .hermesversion: ${String((error as Error).message || error)}`);
    }

    try {
      v1Tag = await readHermesV1Tag(reactNativePath);
    } catch (error) {
      logger.warn(`Could not read .hermesv1version: ${String((error as Error).message || error)}`);
    }

    const normalizeHermesVersion = (value: string) =>
      value
        .replace(/^hermes-?/i, '')
        .replace(/^v/i, '')
        .trim();

    const isHermesV1Enabled = process.env.RCT_HERMES_V1_ENABLED === '1';
    const version = isHermesV1Enabled
      ? properties.HERMES_V1_VERSION_NAME
      : properties.HERMES_VERSION_NAME;
    const tag = isHermesV1Enabled ? v1Tag : classicTag;

    if (!version) {
      throw new Error(
        'Hermes version could not be resolved from version.properties. ' +
          'Provide --hermes-version explicitly.'
      );
    }

    return normalizeHermesVersion(tag ?? version);
  };

  const reactNativeVersion =
    options.reactNativeVersion || rootPackageJson.dependencies?.['react-native'] || 'nightly';

  const hermesVersion = options.hermesVersion ?? (await resolveHermesVersionAsync());

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
