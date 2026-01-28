import { Command } from '@expo/commander';
import chalk from 'chalk';
import path from 'path';

import logger from '../Logger';
import {
  BuildFlavor,
  BuildPlatform,
  getVersionsInfoAsync,
  verifyLocalTarballPathsIfSetAsync,
  verifyPackagesAsync,
  SPMGenerator,
  Frameworks,
  SPMBuild,
  Dependencies,
} from '../prebuilds';
import { Artifacts } from '../prebuilds/Artifacts';
import { SPMVerify } from '../prebuilds/SPMVerify';

type ActionOptions = {
  reactNativeVersion?: string;
  hermesVersion: string;
  cleanArtifacts: boolean;
  cleanDependencies: boolean;
  cleanBuild: boolean;
  cleanGenerated: boolean;
  cleanAll: boolean;
  buildFlavor: BuildFlavor;
  reactNativeTarballPath?: string;
  hermesTarballPath?: string;
  reactNativeDependenciesTarballPath?: string;
  generate?: boolean;
  artifacts?: boolean;
  build?: boolean;
  compose?: boolean;
  productName?: string;
  platform?: BuildPlatform;
  verify?: boolean;
};

async function main(packageNames: string[], options: ActionOptions) {
  try {
    if (packageNames.length === 0) {
      throw new Error(`No package names provided to prebuild.`);
    }

    // A convinience flag to perform all steps
    const performAllSteps =
      !options.artifacts &&
      !options.generate &&
      !options.build &&
      !options.compose &&
      !options.verify;

    const performCleanAll = options.cleanAll;

    // Lets get started
    logger.info(`Expo 📦 Prebuilding packages: ${chalk.green(packageNames.join(', '))}`);

    /**
     * Validation of inputs for the CLI:
     */

    // 1. Check that packages exist and have spm.config.json
    const packages = await verifyPackagesAsync(packageNames);

    // 2. Get versions for React Native and Hermes - we're using bare-expo as the source of truth
    const { reactNativeVersion, hermesVersion } = await getVersionsInfoAsync(options);

    // 3. Verify that the tarball paths exist if provided - this is a way to test locally built tarballs,
    //    and can be used to test out local Hermes, React Native or React Native Dependencies changes
    await verifyLocalTarballPathsIfSetAsync(options);

    // Resolve other options
    const resolvedBuildFlavor = options.buildFlavor || 'Debug';

    // Define paths
    const rootPath = path.resolve(path.join(packages[0].path, '..'));
    const artifactsPath = Artifacts.getArtifactsPath(rootPath);

    /**
     * Prebuilding steps:
     */

    // 1. Clear artifacts / dependencies if requested
    if (options.cleanArtifacts || performCleanAll) {
      await Dependencies.cleanArtifactsAsync(artifactsPath);
    }

    if (options.cleanDependencies || performCleanAll) {
      for (const pkg of packages) {
        await Dependencies.cleanDependenciesFolderAsync(pkg);
      }
    }

    // 2. Download dependencies needed for building the packages - these are defined in the package spm.config.json
    const artifacts = await Dependencies.downloadArtifactsAsync({
      reactNativeVersion,
      hermesVersion,
      artifactsPath,
      buildFlavor: resolvedBuildFlavor,
      localTarballs: {
        reactNative: options.reactNativeTarballPath,
        hermes: options.hermesTarballPath,
        reactNativeDependencies: options.reactNativeDependenciesTarballPath,
      },
      // We'll skip downloading if any of the build/compose/generate options are false and --artifacts is not set to true
      skipArtifacts: performAllSteps ? false : !options.artifacts,
    });

    // 3. Generate/Build each package
    for (const pkg of packages) {
      // If we're building we need to copy dependencies first so that the Package.swift can find them
      await Dependencies.copyOrCheckPackageDependencies(
        pkg,
        artifacts,
        Dependencies.getPackageDependenciesPath(pkg),
        options.artifacts || performAllSteps
      );

      // Get config for the package
      const spmConfig = pkg.getSwiftPMConfiguration();

      for (const product of spmConfig.products) {
        // If a specific product name is requested, skip other products
        if (options.productName && options.productName !== product.name) {
          continue;
        }

        if (options.cleanGenerated || performCleanAll) {
          // Clean generated source code folder!
          await SPMGenerator.cleanGeneratedSourceCodeFolderAsync(pkg, product);
        }

        if (options.generate || performAllSteps) {
          // Generate source code structure for the package/product
          await SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, product);

          // Generate Package.swift and vfs overlay for the package/product
          await SPMGenerator.genereateSwiftPackageAsync(pkg, product, resolvedBuildFlavor);
        }

        if (options.cleanBuild || performCleanAll) {
          // Clean dependencies, build and output paths
          await SPMBuild.cleanBuildFolderAsync(pkg, product);
        }

        if (options.build || performAllSteps) {
          // Build the swift package
          await SPMBuild.buildSwiftPackageAsync(
            pkg,
            product,
            resolvedBuildFlavor,
            options.platform
          );
        }

        // Create xcframeworks from built frameworks
        if (options.compose || performAllSteps) {
          // Let's compose those xcframeworks!
          await Frameworks.composeXCFrameworkAsync(
            pkg,
            product,
            resolvedBuildFlavor,
            options.platform
          );
        }

        // Verify the built xcframeworks if requested
        if (options.verify || performAllSteps) {
          // Verify all products' xcframeworks for this package (logging is handled internally)
          await SPMVerify.verifyXCFrameworkAsync(pkg, product, resolvedBuildFlavor);
        }
      }
    }
  } catch (error) {
    logger.log(
      error instanceof Error ? `❌ ${error.message}` : `❌ An unexpected error occurred: ${error}`
    );
    process.exit(1);
  }
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description('Generates `.xcframework` artifacts for iOS packages.')
    .alias('prebuild')
    .option(
      '-v, --version <version>',
      'Provides the current React Native version.',
      'current react-native version for BareExpo'
    )
    .option('--hermes-version <version>', 'Provides the current Hermes version.')
    .option('--build-flavor <flavor>', 'Build flavor (Debug or Release).', 'Debug')
    .option(
      '--react-native-tarball-path <path>',
      'Optional local path to a React Native tarball to use instead of downloading.'
    )
    .option(
      '--hermes-tarball-path <path>',
      'Optional local path to a Hermes tarball to use instead of downloading.'
    )
    .option(
      '--react-native-dependencies-tarball-path <path>',
      'Optional local path to a React Native Dependencies tarball to use instead of downloading.'
    )
    .option(
      '--clean-artifacts',
      'Clears the artifacts folder before downloading dependencies.',
      false
    )
    .option('--clean-build', 'Cleans the build folder before prebuilding packages.', false)
    .option('--generate', 'Only generate Package.swift files without building.', false)
    .option('--artifacts', 'Only download artifacts without building packages.', false)
    .option('--build', 'Build swift package.', false)
    .option('--compose', 'Compose xcframework from build artifacts.', false)
    .option(
      '--platform <platform>',
      'Build platform (iOS, macOS, tvOS, watchOS). If not specified, builds for all platforms defined in the package.'
    )
    .option(
      '--clean-dependencies',
      'Cleans the dependencies folder in packages before prebuilding it.',
      false
    )
    .option(
      '--product-name <name>',
      'Specify a single product name to prebuild if a package contains multiple products.'
    )
    .option(
      '--clean-generated',
      'Cleans the generated source code folder before generating source code structure.',
      false
    )
    .option(
      '--verify',
      'Verify that thexcframeworks are correctly built and contains the expected architectures.',
      false
    )
    .option(
      '--clean-all',
      'Cleans all build artifacts, dependencies, generated code, and build folders.',
      false
    )
    .asyncAction(main);
};
