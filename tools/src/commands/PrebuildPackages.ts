import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { PACKAGES_DIR } from '../Constants';
import { getPrecompileDir } from '../Directories';
import logger from '../Logger';
import { getPackageByName } from '../Packages';
import {
  BuildFlavor,
  BuildPlatform,
  Codegen,
  getVersionsInfoAsync,
  isExternalPackage,
  SPMPackageSource,
  validateAllPodNamesAsync,
  verifyAllPackagesAsync,
  verifyLocalTarballPathsIfSetAsync,
  SPMGenerator,
  Frameworks,
  SPMBuild,
  Dependencies,
  SigningOptions,
} from '../prebuilds';
import { Artifacts } from '../prebuilds/Artifacts';
import { FrameworkVerifier } from '../prebuilds/Verifier';

type PrebuildCliOptions = {
  reactNativeVersion?: string;
  hermesVersion: string;
  clean: boolean;
  cleanCache: boolean;
  flavor?: BuildFlavor;
  localReactNativeTarball?: string;
  localHermesTarball?: string;
  localReactNativeDepsTarball?: string;
  skipGenerate: boolean;
  skipArtifacts: boolean;
  skipBuild: boolean;
  skipCompose: boolean;
  skipVerify: boolean;
  product?: string;
  platform?: BuildPlatform;
  includeExternal?: boolean;
  sign?: string;
  noTimestamp?: boolean;
  verbose: boolean;
};

type ProductBuildStatus = {
  packageName: string;
  productName: string;
  generate: 'success' | 'failed' | 'skipped';
  build: 'success' | 'failed' | 'skipped';
  compose: 'success' | 'failed' | 'skipped';
  verify: 'success' | 'failed' | 'skipped' | 'warning';
};

type ProductBuildError = {
  packageName: string;
  productName: string;
  step: 'generate' | 'build' | 'compose' | 'verify';
  error: Error;
};

/**
 * Sorts packages in topological order based on their externalDependencies.
 * Packages with no dependencies come first, followed by packages that depend on them.
 */
function sortPackagesByDependencies(packages: SPMPackageSource[]): SPMPackageSource[] {
  // Build a map of package name -> Package
  const packageMap = new Map<string, SPMPackageSource>();
  for (const pkg of packages) {
    packageMap.set(pkg.packageName, pkg);
  }

  // Build a map of product name -> package name
  // This is needed because external packages reference each other by product name
  // (e.g., "RNWorklets") rather than package name (e.g., "react-native-worklets")
  const productToPackage = new Map<string, string>();
  for (const pkg of packages) {
    try {
      const spmConfig = pkg.getSwiftPMConfiguration();
      for (const product of spmConfig.products) {
        productToPackage.set(product.name, pkg.packageName);
      }
    } catch {
      // If we can't read the config, skip
    }
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
            // or "@scope/package-name/ProductName" or just "ProductName"
            let packageName: string;
            if (dep.includes('/')) {
              // Handle scoped packages: @expo/ui/ExpoUI -> @expo/ui
              const parts = dep.split('/');
              packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            } else {
              // Could be a bare product name (e.g., "RNWorklets") or a package name
              // Try to resolve as product name first, fallback to literal
              packageName = productToPackage.get(dep) ?? dep;
            }
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
  // Use packageMap.size for comparisons since it deduplicates by name
  const sorted: SPMPackageSource[] = [];
  const inDegree = new Map<string, number>();

  // Calculate in-degrees (number of dependencies each package has within our build set)
  for (const [name, deps] of dependsOn) {
    inDegree.set(name, deps.size);
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
  if (sorted.length !== packageMap.size) {
    // Find packages involved in the cycle (those not yet sorted)
    const sortedNames = new Set(sorted.map((p) => p.packageName));
    const unsortedPackages = [...packageMap.keys()].filter((name) => !sortedNames.has(name));

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

    // Return deduplicated list in original order
    return [...packageMap.values()];
  }

  // Log the build order if it differs from input
  const originalOrder = [...packageMap.keys()].join(', ');
  const sortedOrder = sorted.map((p) => p.packageName).join(', ');
  if (originalOrder !== sortedOrder) {
    logger.info(`📋 Build order (sorted by dependencies):\n${chalk.cyan(sortedOrder)}`);
  }

  return sorted;
}

/**
 * Standard external dependencies that come from the cache (not from other packages).
 */
const CACHE_DEPS = new Set(['ReactNativeDependencies', 'React', 'Hermes']);

/**
 * Expands the package list to include unbuilt dependencies.
 * When a package depends on another monorepo package (via externalDependencies)
 * and that dependency's xcframework doesn't exist yet, it's automatically added
 * to the build set so the build can succeed without manual intervention.
 */
function expandWithUnbuiltDependencies(packages: SPMPackageSource[]): SPMPackageSource[] {
  const packagesByName = new Map(packages.map((p) => [p.packageName, p]));
  const added = new Map<string, SPMPackageSource>();

  // Iterate until no new packages are discovered
  let changed = true;
  while (changed) {
    changed = false;
    const currentSet = [...packagesByName.values(), ...added.values()];

    for (const pkg of currentSet) {
      let spmConfig;
      try {
        spmConfig = pkg.getSwiftPMConfiguration();
      } catch {
        continue;
      }

      for (const product of spmConfig.products) {
        if (!product.externalDependencies) continue;

        for (const dep of product.externalDependencies) {
          if (!dep.includes('/')) continue;

          // Parse package name and product name (handle scoped: @expo/ui/ExpoUI)
          const parts = dep.split('/');
          const isScoped = parts[0].startsWith('@');
          const depPackageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
          const depProductName = isScoped ? parts[2] : parts[1];

          // Skip cache deps and deps already in the build set
          if (CACHE_DEPS.has(depPackageName)) continue;
          if (packagesByName.has(depPackageName) || added.has(depPackageName)) continue;

          // Check if the xcframework already exists (for both debug and release)
          const depBuildPath = path.join(getPrecompileDir(), '.build', depPackageName);
          const debugExists = fs.existsSync(
            Frameworks.getFrameworkPath(depBuildPath, depProductName, 'Debug')
          );
          const releaseExists = fs.existsSync(
            Frameworks.getFrameworkPath(depBuildPath, depProductName, 'Release')
          );

          if (debugExists && releaseExists) continue;

          // Try to find the package and add it to the build set
          const depPkg = getPackageByName(depPackageName);
          if (depPkg && depPkg.hasSwiftPMConfiguration()) {
            logger.info(
              `📎 Auto-adding ${chalk.cyan(depPackageName)} (required by ${chalk.green(pkg.packageName)}, xcframework not found)`
            );
            added.set(depPackageName, depPkg);
            changed = true;
          }
        }
      }
    }
  }

  if (added.size > 0) {
    return [...packages, ...added.values()];
  }
  return packages;
}

/**
 * Resolves a local tarball path, substituting `{flavor}` with the current build flavor.
 * If the path contains no `{flavor}` placeholder, it is used as-is.
 */
function resolveFlavorTemplatedPath(
  templatePath: string | undefined,
  flavor: BuildFlavor
): string | undefined {
  if (!templatePath) {
    return undefined;
  }
  return templatePath.replace(/\{flavor\}/gi, flavor);
}

async function runPrebuildPackagesAsync(packageNames: string[], options: PrebuildCliOptions) {
  const buildStatuses: ProductBuildStatus[] = [];
  const buildErrors: ProductBuildError[] = [];
  let rootPath = '';
  const startTime = Date.now();

  try {
    // Enable verbose output (full build logs instead of spinners)
    if (options.verbose) {
      process.env.CI = '1';
    }

    const includeExternal = options.includeExternal ?? false;

    // Lets get started
    if (packageNames.length > 0) {
      logger.info(`📦 Prebuilding packages: ${chalk.green(packageNames.join(', '))}`);
    } else {
      const externalNote = includeExternal ? ' (including external packages)' : '';
      logger.info(`📦 Discovering packages with spm.config.json${externalNote}...`);
    }

    /**
     * Validation of inputs for the CLI:
     */

    // 1. Check that packages exist and have spm.config.json (or discover all if none provided)
    //    Use verifyAllPackagesAsync to support both Expo and external packages
    const requestedPackages = await verifyAllPackagesAsync(packageNames, includeExternal);

    // 2. Auto-add unbuilt dependencies to the build set
    const unsortedPackages = expandWithUnbuiltDependencies(requestedPackages);

    // 3. Validate that podName in spm.config.json matches actual .podspec files
    await validateAllPodNamesAsync(unsortedPackages);

    // 4. Sort packages by dependencies (packages with no deps first)
    const packages = sortPackagesByDependencies(unsortedPackages);

    // Log external packages if any
    const externalPackages = packages.filter((p) => isExternalPackage(p));
    if (externalPackages.length > 0) {
      logger.info(
        `📦 External packages to build:\n${chalk.blue(externalPackages.map((p) => p.packageName).join(', '))}`
      );
    }

    // 5. Get versions for React Native and Hermes - we're using bare-expo as the source of truth
    const { reactNativeVersion, hermesVersion } = await getVersionsInfoAsync(options);

    // 6. Verify that the tarball paths exist if provided - this is a way to test locally built tarballs,
    //    and can be used to test out local Hermes, React Native or React Native Dependencies changes.
    //    Skip validation for paths containing {flavor} placeholder — those are validated after resolution.
    const hasPlaceholder = (p?: string) => p?.includes('{flavor}') || p?.includes('{Flavor}');
    await verifyLocalTarballPathsIfSetAsync({
      reactNativeTarballPath: hasPlaceholder(options.localReactNativeTarball)
        ? undefined
        : options.localReactNativeTarball,
      hermesTarballPath: hasPlaceholder(options.localHermesTarball)
        ? undefined
        : options.localHermesTarball,
      reactNativeDependenciesTarballPath: hasPlaceholder(options.localReactNativeDepsTarball)
        ? undefined
        : options.localReactNativeDepsTarball,
    });

    // Resolve build flavors - if not specified, build both Debug and Release
    const buildFlavors: BuildFlavor[] = options.flavor ? [options.flavor] : ['Debug', 'Release'];

    // Define paths - always use PACKAGES_DIR for the cache, regardless of whether
    // we're building local or external packages
    rootPath = PACKAGES_DIR;
    const artifactsPath = Artifacts.getArtifactsPath(rootPath);

    /**
     * Prebuilding steps:
     */

    // 1. Clear cache if explicitly requested (--clean-cache)
    if (options.cleanCache) {
      await Dependencies.cleanArtifactsAsync(artifactsPath);
    }

    // Clean xcframeworks, generated folders, and build folders when --clean is used
    // Note: --clean does NOT clear the dependency cache - use --clean-cache for that
    if (options.clean) {
      for (const pkg of packages) {
        await Dependencies.cleanXCFrameworksFolderAsync(pkg);
        await Dependencies.cleanGeneratedFolderAsync(pkg);
      }
    }

    // 2. Build each package (all flavors per package before moving to next)
    //    Note: Dependencies are no longer copied to each package - Package.swift now references
    //    the centralized cache directly via relative paths
    const totalPackages = packages.length;
    let packageIndex = 0;

    for (const pkg of packages) {
      packageIndex++;
      // Get config for the package
      const spmConfig = pkg.getSwiftPMConfiguration();

      // Log package header
      const flavorInfo =
        buildFlavors.length > 1 ? ` [${buildFlavors.join(' + ')}]` : ` [${buildFlavors[0]}]`;
      logger.info(
        `\n📦 [${packageIndex}/${totalPackages}] ${chalk.green(pkg.packageName)}${flavorInfo}`
      );
      logger.info(`${'─'.repeat(60)}`);

      // Log path summary for verification
      const relPath = (p: string) => path.relative(process.cwd(), p);
      logger.info(`   ・Package:      ${chalk.dim(relPath(pkg.path))}`);
      logger.info(`   ・Build:        ${chalk.dim(relPath(pkg.buildPath))}`);
      logger.info(`   ・Cache:        ${chalk.dim(relPath(artifactsPath))}`);
      logger.info(
        `   ・XCFrameworks: ${chalk.dim(relPath(Frameworks.getFrameworksOutputPath(pkg.buildPath, buildFlavors[0])).replace(`/${buildFlavors[0].toLowerCase()}`, '/<flavor>'))}`
      );

      // Build all flavors for this package
      for (const currentBuildFlavor of buildFlavors) {
        // Download dependencies needed for building the packages - these are defined in the package spm.config.json
        // Dependencies are now downloaded to a centralized versioned cache (packages/external/.cache/)
        const artifacts = await Dependencies.downloadArtifactsAsync({
          reactNativeVersion,
          hermesVersion,
          artifactsPath,
          buildFlavor: currentBuildFlavor,
          localTarballs: {
            reactNative: resolveFlavorTemplatedPath(
              options.localReactNativeTarball,
              currentBuildFlavor
            ),
            hermes: resolveFlavorTemplatedPath(options.localHermesTarball, currentBuildFlavor),
            reactNativeDependencies: resolveFlavorTemplatedPath(
              options.localReactNativeDepsTarball,
              currentBuildFlavor
            ),
          },
          skipArtifacts: options.skipArtifacts,
        });

        for (const product of spmConfig.products) {
          // If a specific product name is requested, skip other products
          if (options.product && options.product !== product.name) {
            continue;
          }

          // Initialize build status for this package/product/flavor
          const status: ProductBuildStatus = {
            packageName: pkg.packageName,
            productName: `${product.name} [${currentBuildFlavor}]`,
            generate: 'skipped',
            build: 'skipped',
            compose: 'skipped',
            verify: 'skipped',
          };
          buildStatuses.push(status);

          if (options.clean) {
            // Clean generated source code folder!
            await SPMGenerator.cleanGeneratedSourceCodeFolderAsync(pkg, product);
          }

          if (!options.skipGenerate) {
            try {
              // Ensure codegen is generated for packages that need it (e.g., Fabric components)
              if (Codegen.hasCodegen(pkg)) {
                const generated = await Codegen.ensureCodegenAsync(pkg, (msg) => logger.info(msg));
                if (generated) {
                  logger.info(`🔧 Generated codegen for ${chalk.green(pkg.packageName)}`);
                } else if (Codegen.isCodegenGenerated(pkg)) {
                  logger.info(`🔧 Codegen already exists for ${chalk.green(pkg.packageName)}`);
                }
              }

              // Generate source code structure for the package/product
              await SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, product);

              // Generate Package.swift and vfs overlay for the package/product
              // Pass artifacts so Package.swift can reference the centralized cache
              await SPMGenerator.generateSwiftPackageAsync(
                pkg,
                product,
                currentBuildFlavor,
                artifacts
              );
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

          if (options.clean) {
            // Clean dependencies, build and output paths
            await SPMBuild.cleanBuildFolderAsync(pkg, product, currentBuildFlavor);
          }

          if (!options.skipBuild) {
            try {
              // Compute hermes include paths for xcodebuild flags.
              // Hermes includes can't go in Package.swift because destroot/include/
              // contains jsi/ headers that conflict with React VFS jsi/ mappings.
              const hermesIncludeDirs = artifacts
                ? [path.join(artifacts.hermes, 'destroot', 'include')]
                : undefined;

              // Build the swift package
              await SPMBuild.buildSwiftPackageAsync(
                pkg,
                product,
                currentBuildFlavor,
                options.platform,
                hermesIncludeDirs
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
          if (!options.skipCompose) {
            try {
              // Build signing options if identity is provided
              const signing: SigningOptions | undefined = options.sign
                ? {
                    identity: options.sign,
                    useTimestamp: !options.noTimestamp,
                  }
                : undefined;

              // Let's compose those xcframeworks!
              await Frameworks.composeXCFrameworkAsync(
                pkg,
                product,
                currentBuildFlavor,
                options.platform,
                signing
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

          // Verify the built xcframeworks
          if (!options.skipVerify) {
            try {
              // Verify all products' xcframeworks for this package (logging is handled internally)
              const verifyResults = await FrameworkVerifier.verifyXCFrameworkAsync(
                pkg,
                product,
                currentBuildFlavor
              );

              // Check if verification actually passed by inspecting the returned reports
              const verificationFailed = [...verifyResults.values()].some(
                (report) => !report.overallSuccess
              );

              // Check for clang warnings (clang failed but overall passed)
              const hasClangWarnings = [...verifyResults.values()].some(
                (report) =>
                  report.overallSuccess && report.slices.some((s) => !s.clangModuleImport.success)
              );

              if (verificationFailed) {
                status.verify = 'failed';
                buildErrors.push({
                  packageName: pkg.packageName,
                  productName: product.name,
                  step: 'verify',
                  error: new Error('Verification failed - see above for details'),
                });
              } else if (hasClangWarnings) {
                status.verify = 'warning';
              } else {
                status.verify = 'success';
              }
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
      } // End of buildFlavors loop (per package)
    } // End of packages loop

    // Print build summary
    printPrebuildSummary(buildStatuses, Date.now() - startTime);

    // Write errors to log file if there were any
    if (buildErrors.length > 0) {
      const logPath = writeErrorLog(rootPath, buildErrors);
      logger.info(`\n📝 Error log written to: ${chalk.yellow(logPath)}`);
      process.exit(1);
    }
  } catch (error) {
    // Print build summary even on error
    printPrebuildSummary(buildStatuses, Date.now() - startTime);

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

function writeErrorLog(rootPath: string, errors: ProductBuildError[]): string {
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${ms}ms`;
  }
}

function printPrebuildSummary(statuses: ProductBuildStatus[], elapsedMs: number) {
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
      verify:
        status.verify === 'success'
          ? '✅'
          : status.verify === 'warning'
            ? '⚠️'
            : status.verify === 'failed'
              ? '❌'
              : '⏭️',
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
      (s.verify === 'success' || s.verify === 'skipped' || s.verify === 'warning')
  ).length;
  const warnings = statuses.filter((s) => s.verify === 'warning').length;
  const failed = statuses.length - successful;

  logger.info('─'.repeat(80));
  const warningText = warnings > 0 ? ` | ${chalk.yellow(`⚠️  ${warnings} with warnings`)}` : '';
  const failedText = failed > 0 ? ` | ${chalk.red(`❌ ${failed} failed`)}` : '';
  const timeText = chalk.blue(`⏱️  ${formatDuration(elapsedMs)}`);
  logger.info(
    `Total: ${statuses.length} | ${chalk.green(`✅ ${successful} successful`)}${warningText}${failedText} | ${timeText}`
  );
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description(
      'Generates `.xcframework` artifacts for iOS packages. If no package names are provided, discovers all packages with spm.config.json.'
    )
    .alias('prebuild')
    .option('-v, --verbose', 'Enable verbose output (full build logs instead of spinners).', false)
    .option(
      '--react-native-version <version>',
      'Provides the current React Native version. Auto-detected from bare-expo if not set.'
    )
    .option('--hermes-version <version>', 'Provides the current Hermes version.')
    .option(
      '-f, --flavor <flavor>',
      'Build flavor (Debug or Release). If not specified, builds both.'
    )
    .option(
      '--local-react-native-tarball <path>',
      'Local path to a React Native tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--local-hermes-tarball <path>',
      'Local path to a Hermes tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--local-react-native-deps-tarball <path>',
      'Local path to a React Native Dependencies tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--clean',
      'Cleans all package outputs (xcframeworks, generated code, build folders) before building. Does not touch the dependency cache.',
      false
    )
    .option(
      '--clean-cache',
      'Clears the entire dependency cache, forcing a fresh download of all artifacts.',
      false
    )
    .option('--skip-generate', 'Skip the generate step.', false)
    .option('--skip-artifacts', 'Skip downloading build artifacts.', false)
    .option('--skip-build', 'Skip the build step.', false)
    .option('--skip-compose', 'Skip composing xcframeworks from build artifacts.', false)
    .option('--skip-verify', 'Skip verification of built xcframeworks.', false)
    .option(
      '-p, --platform <platform>',
      'Build platform (iOS, macOS, tvOS, watchOS). If not specified, builds for all platforms defined in the package.'
    )
    .option(
      '-n, --product <name>',
      'Specify a single product name to prebuild if a package contains multiple products.'
    )
    .option(
      '--include-external',
      'Include external (third-party) packages from packages/external/ in discovery and building.',
      false
    )
    .option(
      '-s, --sign <identity>',
      'Code signing identity (certificate name) to sign the XCFrameworks. If not provided, frameworks are left unsigned.'
    )
    .option(
      '--no-timestamp',
      'Disable secure timestamp when signing. By default, signing includes --timestamp for long-term signature validity.',
      false
    )
    .asyncAction(runPrebuildPackagesAsync);
};
