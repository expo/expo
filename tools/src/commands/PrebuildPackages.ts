import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import logger from '../Logger';
import { Package } from '../Packages';
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

type BuildStatus = {
  packageName: string;
  productName: string;
  generate: 'success' | 'failed' | 'skipped';
  build: 'success' | 'failed' | 'skipped';
  compose: 'success' | 'failed' | 'skipped';
  verify: 'success' | 'failed' | 'skipped';
};

type BuildError = {
  packageName: string;
  productName: string;
  step: 'generate' | 'build' | 'compose' | 'verify';
  error: Error;
};

/**
 * Sorts packages in topological order based on their externalDependencies.
 * Packages with no dependencies come first, followed by packages that depend on them.
 */
function sortPackagesByDependencies(packages: Package[]): Package[] {
  // Build a map of package name -> Package
  const packageMap = new Map<string, Package>();
  for (const pkg of packages) {
    packageMap.set(pkg.packageName, pkg);
  }

  // Build dependency graph: package name -> set of package names it depends on
  const dependsOn = new Map<string, Set<string>>();

  for (const pkg of packages) {
    const deps = new Set<string>();
    try {
      const spmConfig = pkg.getSwiftPMConfiguration();
      for (const product of spmConfig.products) {
        if (product.externalDependencies) {
          for (const dep of product.externalDependencies) {
            // Dependencies can be "package-name" or "package-name/ProductName"
            const packageName = dep.includes('/') ? dep.split('/')[0] : dep;
            // Only track dependencies that are in our build set
            if (packageMap.has(packageName)) {
              deps.add(packageName);
            }
          }
        }
      }
    } catch {
      // If we can't read the config, assume no dependencies
    }
    dependsOn.set(pkg.packageName, deps);
  }

  // Topological sort using Kahn's algorithm
  const sorted: Package[] = [];
  const inDegree = new Map<string, number>();

  // Calculate in-degrees (number of dependencies each package has within our build set)
  for (const pkg of packages) {
    const deps = dependsOn.get(pkg.packageName) ?? new Set();
    inDegree.set(pkg.packageName, deps.size);
  }

  // Find all packages with no dependencies (in-degree 0)
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) {
      queue.push(name);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const name = queue.shift()!;
    const pkg = packageMap.get(name);
    if (pkg) {
      sorted.push(pkg);
    }

    // For each package that depends on this one, decrement its in-degree
    for (const [otherName, deps] of dependsOn) {
      if (deps.has(name)) {
        const newDegree = (inDegree.get(otherName) ?? 1) - 1;
        inDegree.set(otherName, newDegree);
        if (newDegree === 0) {
          queue.push(otherName);
        }
      }
    }
  }

  // If we didn't get all packages, there's a cycle - report it and return original order
  if (sorted.length !== packages.length) {
    // Find packages involved in the cycle (those not yet sorted)
    const unsortedPackages = packages.filter((p) => !sorted.includes(p)).map((p) => p.packageName);

    logger.warn(`⚠️  Circular dependency detected in packages, building in original order`);
    logger.warn(`   Packages involved in cycle: ${chalk.yellow(unsortedPackages.join(', '))}`);

    // Show the dependency relationships for unsorted packages
    for (const pkgName of unsortedPackages) {
      const deps = dependsOn.get(pkgName);
      if (deps && deps.size > 0) {
        const cycleDeps = [...deps].filter((d) => unsortedPackages.includes(d));
        if (cycleDeps.length > 0) {
          logger.warn(
            `   ${chalk.cyan(pkgName)} depends on: ${chalk.yellow(cycleDeps.join(', '))}`
          );
        }
      }
    }

    return packages;
  }

  // Log the build order if it differs from input
  const originalOrder = packages.map((p) => p.packageName).join(', ');
  const sortedOrder = sorted.map((p) => p.packageName).join(', ');
  if (originalOrder !== sortedOrder) {
    logger.info(`📋 Build order (sorted by dependencies): ${chalk.cyan(sortedOrder)}`);
  }

  return sorted;
}

async function main(packageNames: string[], options: ActionOptions) {
  const buildStatuses: BuildStatus[] = [];
  const buildErrors: BuildError[] = [];
  let rootPath = '';

  try {
    // A convinience flag to perform all steps
    const performAllSteps =
      !options.artifacts &&
      !options.generate &&
      !options.build &&
      !options.compose &&
      !options.verify;

    const performCleanAll = options.cleanAll;

    // Lets get started
    if (packageNames.length > 0) {
      logger.info(`Expo 📦 Prebuilding packages: ${chalk.green(packageNames.join(', '))}`);
    } else {
      logger.info(`Expo 📦 Discovering packages with spm.config.json...`);
    }

    /**
     * Validation of inputs for the CLI:
     */

    // 1. Check that packages exist and have spm.config.json (or discover all if none provided)
    const unsortedPackages = await verifyPackagesAsync(packageNames);

    // 2. Sort packages by dependencies (packages with no deps first)
    const packages = sortPackagesByDependencies(unsortedPackages);

    // 3. Get versions for React Native and Hermes - we're using bare-expo as the source of truth
    const { reactNativeVersion, hermesVersion } = await getVersionsInfoAsync(options);

    // 4. Verify that the tarball paths exist if provided - this is a way to test locally built tarballs,
    //    and can be used to test out local Hermes, React Native or React Native Dependencies changes
    await verifyLocalTarballPathsIfSetAsync(options);

    // Resolve other options
    const resolvedBuildFlavor = options.buildFlavor || 'Debug';

    // Define paths
    rootPath = path.resolve(path.join(packages[0].path, '..'));
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

        // Initialize build status for this package/product
        const status: BuildStatus = {
          packageName: pkg.packageName,
          productName: product.name,
          generate: 'skipped',
          build: 'skipped',
          compose: 'skipped',
          verify: 'skipped',
        };
        buildStatuses.push(status);

        if (options.cleanGenerated || performCleanAll) {
          // Clean generated source code folder!
          await SPMGenerator.cleanGeneratedSourceCodeFolderAsync(pkg, product);
        }

        if (options.generate || performAllSteps) {
          try {
            // Generate source code structure for the package/product
            await SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, product);

            // Generate Package.swift and vfs overlay for the package/product
            await SPMGenerator.genereateSwiftPackageAsync(pkg, product, resolvedBuildFlavor);
            status.generate = 'success';
          } catch (error) {
            status.generate = 'failed';
            const err = error instanceof Error ? error : new Error(String(error));
            buildErrors.push({
              packageName: pkg.packageName,
              productName: product.name,
              step: 'generate',
              error: err,
            });
            logger.log(`❌ [${pkg.packageName}/${product.name}] Generate failed: ${err.message}`);
            continue; // Skip to next product
          }
        }

        if (options.cleanBuild || performCleanAll) {
          // Clean dependencies, build and output paths
          await SPMBuild.cleanBuildFolderAsync(pkg, product);
        }

        if (options.build || performAllSteps) {
          try {
            // Build the swift package
            await SPMBuild.buildSwiftPackageAsync(
              pkg,
              product,
              resolvedBuildFlavor,
              options.platform
            );
            status.build = 'success';
          } catch (error) {
            status.build = 'failed';
            const err = error instanceof Error ? error : new Error(String(error));
            buildErrors.push({
              packageName: pkg.packageName,
              productName: product.name,
              step: 'build',
              error: err,
            });
            logger.log(`❌ [${pkg.packageName}/${product.name}] Build failed: ${err.message}`);
            continue; // Skip to next product
          }
        }

        // Create xcframeworks from built frameworks
        if (options.compose || performAllSteps) {
          try {
            // Let's compose those xcframeworks!
            await Frameworks.composeXCFrameworkAsync(
              pkg,
              product,
              resolvedBuildFlavor,
              options.platform
            );
            status.compose = 'success';
          } catch (error) {
            status.compose = 'failed';
            const err = error instanceof Error ? error : new Error(String(error));
            buildErrors.push({
              packageName: pkg.packageName,
              productName: product.name,
              step: 'compose',
              error: err,
            });
            logger.log(`❌ [${pkg.packageName}/${product.name}] Compose failed: ${err.message}`);
            continue; // Skip to next product
          }
        }

        // Verify the built xcframeworks if requested
        if (options.verify || performAllSteps) {
          try {
            // Verify all products' xcframeworks for this package (logging is handled internally)
            await SPMVerify.verifyXCFrameworkAsync(pkg, product, resolvedBuildFlavor);
            status.verify = 'success';
          } catch (error) {
            status.verify = 'failed';
            const err = error instanceof Error ? error : new Error(String(error));
            buildErrors.push({
              packageName: pkg.packageName,
              productName: product.name,
              step: 'verify',
              error: err,
            });
            logger.log(`❌ [${pkg.packageName}/${product.name}] Verify failed: ${err.message}`);
          }
        }
      }
    }

    // Print build summary
    printBuildSummary(buildStatuses);

    // Write errors to log file if there were any
    if (buildErrors.length > 0) {
      const logPath = writeErrorLog(rootPath, buildErrors);
      logger.info(`\n📝 Error log written to: ${chalk.yellow(logPath)}`);
      process.exit(1);
    }
  } catch (error) {
    // Print build summary even on error
    printBuildSummary(buildStatuses);

    // Write errors to log file
    if (buildErrors.length > 0 && rootPath) {
      const logPath = writeErrorLog(rootPath, buildErrors);
      logger.info(`\n📝 Error log written to: ${chalk.yellow(logPath)}`);
    }

    logger.log(
      error instanceof Error ? `❌ ${error.message}` : `❌ An unexpected error occurred: ${error}`
    );
    process.exit(1);
  }
}

function writeErrorLog(rootPath: string, errors: BuildError[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `prebuild-errors-${timestamp}.log`;
  const logPath = path.join(rootPath, logFileName);

  const logContent = errors
    .map((err) => {
      return `
================================================================================
Package: ${err.packageName}
Product: ${err.productName}
Step: ${err.step}
Time: ${new Date().toISOString()}
--------------------------------------------------------------------------------
Error: ${err.error.message}
${err.error.stack ? `\nStack trace:\n${err.error.stack}` : ''}
================================================================================
`;
    })
    .join('\n');

  const header = `Prebuild Errors Log
Generated: ${new Date().toISOString()}
Total Errors: ${errors.length}
${'='.repeat(80)}
`;

  fs.writeFileSync(logPath, header + logContent, 'utf-8');
  return logPath;
}

function printBuildSummary(statuses: BuildStatus[]) {
  if (statuses.length === 0) {
    return;
  }

  logger.info('\n📊 Build Summary:');
  logger.info('─'.repeat(80));

  for (const status of statuses) {
    const statusIcons = {
      generate: status.generate === 'success' ? '✅' : status.generate === 'failed' ? '❌' : '⏭️',
      build: status.build === 'success' ? '✅' : status.build === 'failed' ? '❌' : '⏭️',
      compose: status.compose === 'success' ? '✅' : status.compose === 'failed' ? '❌' : '⏭️',
      verify: status.verify === 'success' ? '✅' : status.verify === 'failed' ? '❌' : '⏭️',
    };

    const productDisplay =
      status.packageName === status.productName
        ? chalk.cyan(status.packageName)
        : `${chalk.cyan(status.packageName)}/${chalk.yellow(status.productName)}`;

    logger.info(
      `${productDisplay}: Gen ${statusIcons.generate} | Build ${statusIcons.build} | Compose ${statusIcons.compose} | Verify ${statusIcons.verify}`
    );
  }

  const successful = statuses.filter(
    (s) =>
      (s.generate === 'success' || s.generate === 'skipped') &&
      (s.build === 'success' || s.build === 'skipped') &&
      (s.compose === 'success' || s.compose === 'skipped') &&
      (s.verify === 'success' || s.verify === 'skipped')
  ).length;
  const failed = statuses.length - successful;

  logger.info('─'.repeat(80));
  const failedText = failed > 0 ? ` | ${chalk.red(`❌ ${failed} failed`)}` : '';
  logger.info(
    `Total: ${statuses.length} | ${chalk.green(`✅ ${successful} successful`)}${failedText}`
  );
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description(
      'Generates `.xcframework` artifacts for iOS packages. If no package names are provided, discovers all packages with spm.config.json.'
    )
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
