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
   * @param outputPath Path to build output
   * @param buildType Build flavor (Debug or Release)
   * @param options Build options including platform and product name
   */
  buildSwiftPackageAsync: async (
    pkg: Package,
    buildType: BuildFlavor,
    options?: {
      platform?: BuildPlatform;
      productName?: string;
    }
  ): Promise<void> => {
    // Implementation for building the package
    logger.info(
      `🏗  Build Swift package for ${chalk.green(pkg.packageName)} [${buildType.toLowerCase()}]`
    );

    // Load the configuration file for the package
    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package: ${pkg.packageName}`);
    }

    // Verify that we have a Package.swift file in the package directory
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg);
    if (!(await fs.existsSync(packageSwiftPath))) {
      throw new Error(`No Package.swift file found in package: ${pkg.packageName}`);
    }

    // Get from options
    const platform = options?.platform;
    const productName = options?.productName;

    // Build for each platform specified in the spmConfig
    for (const spmPlatform of spmConfig.platforms) {
      const buildPlatforms = getBuildPlatformsFromProductPlatform(spmPlatform);

      // For each platform
      for (const buildPlatform of buildPlatforms) {
        // Skip platform if a specific platform is requested
        if (platform && buildPlatform !== platform) {
          continue;
        }

        // Build each product if productName is not specified, otherwise only build the specified product
        if (productName) {
          // Check that we have the product we're trying to build:
          const product = spmConfig.products.find((p) => p.name === productName);
          if (!product) {
            throw new Error(`Product '${productName}' not found in package: ${pkg.packageName}`);
          }
        }

        // Create the output path
        const derivedDataPath = SPMBuild.getPackageBuildPath(pkg);

        // Only use BUILD_LIBRARY_FOR_DISTRIBUTION for products containing swift targets
        const containsSwiftTargets = spmConfig.targets.some((target) => target?.type === 'swift');
        const buildLibraryForDistributionFlag = containsSwiftTargets
          ? 'BUILD_LIBRARY_FOR_DISTRIBUTION=YES'
          : '';

        // Now let's build the package for the given platform
        // Run XCode build command with formatted output
        const args = [
          '-scheme',
          productName
            ? productName
            : pkg.packageName + (spmConfig.products.length > 1 ? '-Package' : ''),
          `-destination`,
          `generic/platform=${buildPlatform}`,
          `-derivedDataPath`,
          `${derivedDataPath}`,
          `-configuration`,
          `${buildType}`,
          'SKIP_INSTALL=NO',
          ...(buildLibraryForDistributionFlag ? [buildLibraryForDistributionFlag] : []),
          'DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
        ];

        args.push('build');

        const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
          args,
          pkg.path,
          `Building ${chalk.green(pkg.packageName) + (productName ? '/' + chalk.green(productName) : '')} for ${chalk.green(buildPlatform) + '/' + chalk.green(buildType.toLowerCase())}`
        );

        if (code !== 0) {
          throw new Error(
            `xcodebuild failed with code ${code}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`
          );
        }
      }
    }

    logger.info(`🏗  Swift package successfully built.`);
  },

  /**
   * Cleans the build output folder
   * @param pkg Package
   */
  cleanBuildFolderAsync: async (pkg: Package): Promise<void> => {
    const buildFolderToClean = SPMBuild.getPackageBuildPath(pkg);
    logger.info(
      `🧹 Cleaning build folder ${chalk.green(path.relative(pkg.path, buildFolderToClean))}...`
    );
    await fs.remove(buildFolderToClean);
  },

  /**
   * Returns the output path where we'll build the frameworks for the package.
   * @param pkg Package
   * @returns Output path
   */
  getPackageBuildPath: (pkg: Package) => {
    return path.join(pkg.path, '.build', 'frameworks', pkg.packageName);
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
    const buildOutputPath = SPMBuild.getPackageBuildPath(pkg);

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
