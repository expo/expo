import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Package } from '../Packages';
import { BuildFlavor } from './Prebuilder.types';
import { BuildPlatform, ProductPlatform, SPMProduct } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { spawnXcodeBuildWithSpinner } from './XCodeRunner';
import logger from '../Logger';

export const SPMBuild = {
  /**
   * Builds the Swift package using xcodebuild.
   * @param pkg Pacakge to build
   * @param product Product to build
   * @param buildType Build flavor (Debug or Release)
   * @param platform Optional activate platform to build for
   */
  buildSwiftPackageAsync: async (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor,
    platform?: BuildPlatform
  ): Promise<void> => {
    logger.info(
      `🏗  Build Swift package for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)} (${buildType.toLowerCase()})`
    );

    // Verify that we have a Package.swift file in the package directory
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg, product);
    if (!(await fs.existsSync(packageSwiftPath))) {
      throw new Error(`No Package.swift file found in package: ${pkg.packageName}`);
    }

    // Collect all build platforms, filtering if a specific platform is requested
    const buildPlatforms = getBuildPlatformsForProduct(product, platform);
    if (buildPlatforms.length === 0) {
      throw new Error(
        `No build platforms found for product: ${product.name} in package: ${pkg.packageName}`
      );
    }

    // Build for each platform
    for (const buildPlatform of buildPlatforms) {
      await buildForPlatformAsync(pkg, product, buildType, buildPlatform, packageSwiftPath);
    }

    logger.info(`🏗  Swift package successfully built.`);
  },

  /**
   * Cleans the build output folder
   * @param pkg Package
   * @param product Product
   */
  cleanBuildFolderAsync: async (pkg: Package, product: SPMProduct): Promise<void> => {
    const buildFolderToClean = SPMBuild.getPackageBuildPath(pkg, product);
    logger.info(
      `🧹 Cleaning build folder ${chalk.green(path.relative(pkg.path, buildFolderToClean))}...`
    );
    await fs.remove(buildFolderToClean);
  },

  /**
   * Returns the output path where we'll build the frameworks for the package.
   * @param pkg Package
   * @param product Product
   * @returns Output path
   */
  getPackageBuildPath: (pkg: Package, product: SPMProduct) => {
    return path.join(pkg.path, '.build', 'frameworks', pkg.packageName, product.name);
  },

  /**
   * Returns the path to the built product for a given package product and build type.
   * @param pkg Pacakge
   * @param product product
   * @param buildType buildType
   * @param buildPlatform build platform
   * @returns Path to the folder where to find the built product and its bundles
   */
  getProductArtifactsPath: (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor,
    buildPlatform: BuildPlatform
  ) => {
    const buildOutputPath = SPMBuild.getPackageBuildPath(pkg, product);

    const buildFolderPrefix = getBuildFolderPrefixForPlatform(buildPlatform);

    return path.join(buildOutputPath, 'Build', 'Products', `${buildType}-${buildFolderPrefix}`);
  },

  /**
   * Returns the path to the built product framework for a given package product and build type.
   * @param pkg Pacakge
   * @param product product
   * @param buildType buildType
   * @param buildPlatform build platform
   * @returns Path to the folder where to find the built product framework is found
   */
  getProductFrameworkArtifactsPath: (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor,
    buildPlatform: BuildPlatform
  ) => {
    const productOutputPath = SPMBuild.getProductArtifactsPath(
      pkg,
      product,
      buildType,
      buildPlatform
    );

    return path.join(productOutputPath, 'PackageFrameworks', `${product.name}.framework`);
  },

  /**
   * Returns the path to the build product's dSYM symbols bundle.
   * @param pkg Pacakge
   * @param product product
   * @param buildType buildType
   * @param buildPlatform build platform
   * @returns Path to the folder where to find the built product framework's symbol bundle is found
   */
  getProductSymbolsBundleArtifactsPath: (
    pkg: Package,
    product: SPMProduct,
    buildType: BuildFlavor,
    buildPlatform: BuildPlatform
  ) => {
    const productOutputPath = SPMBuild.getProductArtifactsPath(
      pkg,
      product,
      buildType,
      buildPlatform
    );

    return path.join(productOutputPath, `${product.name}.framework.dSYM`);
  },
};

/**
 * Gets all build platforms for a product, optionally filtering to a specific platform.
 * @param product SPM product
 * @param platform Optional platform to filter to
 * @returns Array of build platforms
 */
const getBuildPlatformsForProduct = (
  product: SPMProduct,
  platform?: BuildPlatform
): BuildPlatform[] => {
  const allPlatforms = product.platforms.flatMap(getBuildPlatformsFromProductPlatform);
  return platform ? allPlatforms.filter((p) => p === platform) : allPlatforms;
};

/**
 * Builds the xcodebuild arguments for a platform build.
 * @param pkg Package
 * @param product Product
 * @param buildType Build flavor
 * @param buildPlatform Target platform
 * @returns Array of xcodebuild arguments
 */
const buildXcodeBuildArgs = (
  pkg: Package,
  product: SPMProduct,
  buildType: BuildFlavor,
  buildPlatform: BuildPlatform
): string[] => {
  const derivedDataPath = SPMBuild.getPackageBuildPath(pkg, product);
  const containsSwiftTargets = product.targets.some((target) => target?.type === 'swift');

  return [
    '-scheme',
    pkg.packageName,
    '-destination',
    `generic/platform=${buildPlatform}`,
    '-derivedDataPath',
    derivedDataPath,
    '-configuration',
    buildType,
    'SKIP_INSTALL=NO',
    ...(containsSwiftTargets ? ['BUILD_LIBRARY_FOR_DISTRIBUTION=YES'] : []),
    'DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
    'build',
  ];
};

/**
 * Builds the package for a specific platform.
 * @param pkg Package
 * @param product Product
 * @param buildType Build flavor
 * @param buildPlatform Target platform
 * @param packageSwiftPath Path to Package.swift
 */
const buildForPlatformAsync = async (
  pkg: Package,
  product: SPMProduct,
  buildType: BuildFlavor,
  buildPlatform: BuildPlatform,
  packageSwiftPath: string
): Promise<void> => {
  const args = buildXcodeBuildArgs(pkg, product, buildType, buildPlatform);

  const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
    args,
    path.dirname(packageSwiftPath),
    `Building ${chalk.green(pkg.packageName)}/${chalk.green(product.name)} for ${chalk.green(buildPlatform)}/${chalk.green(buildType.toLowerCase())}`
  );

  if (code !== 0) {
    throw new Error(
      `xcodebuild failed with code ${code}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`
    );
  }
};

/**
 * Maps a ProductPlatform to an array of BuildPlatforms
 */
export const getBuildPlatformsFromProductPlatform = (
  platform: ProductPlatform
): BuildPlatform[] => {
  switch (platform) {
    case 'iOS(.v15)':
      return ['iOS', 'iOS Simulator'];
    case 'macOS(.v11)':
      return ['macOS'];
    case 'tvOS(.v15)':
      return ['tvOS', 'tvOS Simulator'];
    case 'macCatalyst(.v15)':
      return ['macOS,variant=Mac Catalyst'];
    default:
      return [];
  }
};

/**
 * Returns the output folder postfix for a given build platform
 * @param platform Platform
 * @returns Folder name postfix
 */
export const getBuildFolderPrefixForPlatform = (platform: BuildPlatform): string => {
  switch (platform) {
    case 'iOS':
      return 'iphoneos';
    case 'iOS Simulator':
      return 'iphonesimulator';
    case 'macOS':
      return 'macosx';
    case 'macOS,variant=Mac Catalyst':
      return 'maccatalyst';
    case 'tvOS':
      return 'appletvos';
    case 'tvOS Simulator':
      return 'appletvsimulator';
    case 'visionOS':
      return 'visionos';
    case 'visionOS Simulator':
      return 'visionossimulator';
    default:
      return '';
  }
};
