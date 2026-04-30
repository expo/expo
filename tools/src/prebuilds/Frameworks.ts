import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import { getPrecompileDir } from '../Directories';
import logger from '../Logger';
import type { SPMPackageSource } from './ExternalPackage';
import { BuildFlavor } from './Prebuilder.types';
import {
  enrichFrameworkWithHeaders,
  findFirstExisting,
  getBuildFolderPrefixForPlatform,
  getBuildPlatformsForProduct,
  SPMBuild,
} from './SPMBuild';
import { BuiltFramework } from './SPMBuild.types';
import { BuildPlatform, SPMConfig, SPMProduct } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { createAsyncSpinner, SpinnerError } from './Utils';
import { spawnXcodeBuildWithSpinner } from './XCodeRunner';

/**
 * Options for code signing XCFrameworks.
 */
export type SigningOptions = {
  /** The code signing identity (certificate name) to use. If not provided, signing is skipped. */
  identity?: string;
  /** Whether to include a secure timestamp from Apple's timestamp server. Defaults to true. */
  useTimestamp?: boolean;
};

/**
 * Signs an XCFramework using the macOS codesign tool.
 * @param xcframeworkPath Path to the XCFramework to sign
 * @param identity Code signing identity (certificate name)
 * @param useTimestamp Whether to include a secure timestamp (default: true)
 */
const signXCFramework = (
  xcframeworkPath: string,
  identity: string,
  useTimestamp: boolean = true
): void => {
  logger.info(`🔏 Signing XCFramework with identity "${identity}"...`);

  const timestampFlag = useTimestamp ? '--timestamp' : '';
  const command = `codesign ${timestampFlag} --sign "${identity}" "${xcframeworkPath}"`.trim();

  try {
    execSync(command, { stdio: 'inherit' });
    logger.info(`✅ Successfully signed ${path.basename(xcframeworkPath)}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new Error(`Failed to sign XCFramework: ${err.message}`);
  }
};

export const Frameworks = {
  /**
   * Composes an XCFramework from the given built frameworks.
   * @param pkg Package
   * @param product SPM product
   * @param buildType Build flavor (Debug or Release)
   * @param platform Optional platform to filter on
   * @param signing Optional signing configuration. If identity is provided, the framework will be signed.
   */
  composeXCFrameworkAsync: async (
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor,
    platform?: BuildPlatform,
    signing?: SigningOptions,
    options?: { bundleSharedDeps?: boolean }
  ): Promise<void> => {
    const spmConfig = pkg.getSwiftPMConfiguration();

    logger.info(
      `🧩 Composing XCFramework for ${chalk.green(pkg.packageName) + '/' + chalk.green(product.name)}...`
    );

    // Get output path for the XCFramework
    const xcframeworkOutputPath = Frameworks.getFrameworkPath(
      pkg.buildPath,
      product.name,
      buildType,
      pkg.outputVersionPrefix
    );

    // Collect frameworks for each build platform
    const frameworks = collectFrameworksForProduct(pkg, product, buildType, platform);

    // Compose the XCFramework folder structure using XCode
    const slices = await composeFrameworkWithXCodeAsync(
      pkg,
      product,
      frameworks,
      xcframeworkOutputPath
    );

    // Collect and copy header files
    const {
      headerFiles: collectedHeaderFiles,
      targetModuleNames,
      textualHeaderModules,
    } = await collectAndCopyHeaderFilesFromBuiltFrameworksAsync(
      pkg,
      product,
      xcframeworkOutputPath
    );

    // Check if this product has a Swift target
    const hasSwiftTarget = product.targets.some((target) => target?.type === 'swift');

    // Process each slice: copy headers, create module maps, and handle Swift interfaces
    await processXCFrameworkSlices(
      pkg,
      spmConfig,
      product,
      buildType,
      slices,
      xcframeworkOutputPath,
      collectedHeaderFiles,
      hasSwiftTarget,
      targetModuleNames,
      textualHeaderModules
    );

    // Remove the toplevel Headers directory as it's no longer needed
    await fs.remove(path.join(xcframeworkOutputPath, 'Headers'));

    // Copy resource bundles into each xcframework slice (if any targets have resources)
    await copyResourceBundlesIntoXCFrameworkAsync(
      pkg,
      product,
      buildType,
      slices,
      xcframeworkOutputPath
    );

    // Copy SPM dependency xcframeworks (e.g., Lottie.xcframework for lottie-react-native)
    // These are pre-built binary frameworks that the product dynamically links against
    // and must be embedded in the app bundle at runtime.
    await copySPMDependencyXCFrameworksAsync(pkg, product, buildType, options?.bundleSharedDeps);

    // Sign the XCFramework if a signing identity is provided
    if (signing?.identity) {
      signXCFramework(xcframeworkOutputPath, signing.identity, signing.useTimestamp ?? true);
    }

    // Create tarball containing the product xcframework and any SPM dependency xcframeworks
    await createProductTarballAsync(pkg, product, buildType, options?.bundleSharedDeps);
  },

  /**
   * Gets the output path for xcframeworks for the given package.
   * XCFrameworks are stored under: <buildPath>/output/<flavor>/xcframeworks/
   * For versioned 3rd-party packages: <buildPath>/output/<versionPrefix>/<flavor>/xcframeworks/
   * @param buildPath Package build path (centralized under packages/precompile/.build/<pkg>/)
   * @param buildType Build flavor
   * @param versionPrefix Optional version prefix for 3rd-party packages (e.g. "1.2.3/0.83.0/1.0.0")
   * @returns Output path for xcframeworks
   */
  getFrameworksOutputPath: (
    buildPath: string,
    buildType: BuildFlavor,
    versionPrefix?: string
  ): string => {
    const parts = [buildPath, 'output'];
    if (versionPrefix) {
      parts.push(versionPrefix);
    }
    parts.push(buildType.toLowerCase(), 'xcframeworks');
    return path.join(...parts);
  },

  /**
   * Returns the full path to the built XCFramework for the given product.
   * @param buildPath Package build path (centralized under packages/precompile/.build/<pkg>/)
   * @param productName SPM product name
   * @param buildType Build flavor
   * @param versionPrefix Optional version prefix for 3rd-party packages
   * @returns Full path to the built XCFramework
   */
  getFrameworkPath: (
    buildPath: string,
    productName: string,
    buildType: BuildFlavor,
    versionPrefix?: string
  ): string => {
    return path.join(
      Frameworks.getFrameworksOutputPath(buildPath, buildType, versionPrefix),
      `${productName}.xcframework`
    );
  },

  /**
   * Returns the full path to the tarball for the given product.
   * @param buildPath Package build path (centralized under packages/precompile/.build/<pkg>/)
   * @param productName SPM product name
   * @param buildType Build flavor
   * @param versionPrefix Optional version prefix for 3rd-party packages
   * @returns Full path to the product tarball
   */
  getTarballPath: (
    buildPath: string,
    productName: string,
    buildType: BuildFlavor,
    versionPrefix?: string
  ): string => {
    return path.join(
      Frameworks.getFrameworksOutputPath(buildPath, buildType, versionPrefix),
      `${productName}.tar.gz`
    );
  },

  /**
   * Returns the root directory for shared SPM dependency xcframeworks.
   * Shared deps are stored under: packages/precompile/.build/.spm-deps/
   */
  getSharedSPMDepsRoot: (): string => {
    return path.join(getPrecompileDir(), '.build', '.spm-deps');
  },

  /**
   * Returns the path to a shared SPM dependency xcframework.
   * @param productName The SPM product name (e.g., "SDWebImage")
   * @param buildType Build flavor (Debug or Release)
   * @returns Full path to the shared xcframework
   */
  getSharedSPMDepFrameworkPath: (productName: string, buildType: BuildFlavor): string => {
    return path.join(
      Frameworks.getSharedSPMDepsRoot(),
      productName,
      buildType.toLowerCase(),
      `${productName}.xcframework`
    );
  },

  /**
   * Checks if a shared SPM dependency xcframework exists.
   * @param productName The SPM product name (e.g., "SDWebImage")
   * @param buildType Build flavor (Debug or Release)
   * @returns true if the shared xcframework exists
   */
  hasSharedSPMDepFramework: (productName: string, buildType: BuildFlavor): boolean => {
    return fs.existsSync(Frameworks.getSharedSPMDepFrameworkPath(productName, buildType));
  },

  /**
   * Computes the output version prefix for a dependency package, given the building
   * package's version prefix and the dependency's package version.
   *
   * Version prefixes have the format: <packageVersion>/<reactNativeVersion>/<hermesVersion>
   * The RN and Hermes version parts are shared across all external packages in a build,
   * so we extract them from the building package's prefix and combine with the dep's version.
   *
   * @param buildingPkgVersionPrefix The building package's outputVersionPrefix (e.g. "4.2.2/0.85.0/1.0.0")
   * @param depPackageVersion The dependency package's version (e.g. "0.16.0")
   * @returns The computed version prefix for the dependency (e.g. "0.16.0/0.85.0/1.0.0")
   */
  computeVersionPrefixForDependency: (
    buildingPkgVersionPrefix: string,
    depPackageVersion: string
  ): string => {
    // Split prefix into parts: [packageVersion, rnVersion, hermesVersion]
    const parts = buildingPkgVersionPrefix.split(path.sep);
    // Replace the first part (building package's version) with the dep's version
    // Keep the RN and Hermes version parts (index 1 and beyond)
    return path.join(depPackageVersion, ...parts.slice(1));
  },
};

/**
 * Collects framework paths for all build platforms of a product.
 * @param pkg Package
 * @param product SPM product
 * @param buildType Build flavor
 * @param platform Optional platform to filter on
 * @returns Array of built framework information
 */
const collectFrameworksForProduct = (
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  platform?: BuildPlatform
): BuiltFramework[] => {
  // Expand product platforms to build platforms (e.g., iOS(.v15) -> [iOS, iOS Simulator])
  const allBuildPlatforms = getBuildPlatformsForProduct(product);

  // Filter and map to framework info
  return allBuildPlatforms
    .filter((buildPlatform) => !platform || buildPlatform === platform)
    .map((buildPlatform) => ({
      symbolsBundlePath: SPMBuild.getProductSymbolsBundleArtifactsPath(
        pkg,
        product,
        buildType,
        buildPlatform
      ),
      frameworkPath: SPMBuild.getProductFrameworkArtifactsPath(
        pkg,
        product,
        buildType,
        buildPlatform
      ),
      product,
      buildType,
    }));
};

/**
 * Processes each xcframework slice: copies headers, creates module maps, and handles Swift interfaces.
 * @param pkg Package
 * @param spmConfig SPM configuration
 * @param product SPM product
 * @param buildType Build flavor
 * @param slices Array of slice names
 * @param xcframeworkOutputPath Path to the xcframework
 * @param collectedHeaderFiles Collected header files
 * @param hasSwiftTarget Whether the product has a Swift target
 * @param targetModuleNames Map of module names to their headers
 * @param textualHeaderModules Set of module names that should use textual headers
 */
const processXCFrameworkSlices = async (
  pkg: SPMPackageSource,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slices: string[],
  xcframeworkOutputPath: string,
  collectedHeaderFiles: string[],
  hasSwiftTarget: boolean,
  targetModuleNames: Map<string, string[]>,
  textualHeaderModules: Set<string> = new Set()
): Promise<void> => {
  const sourceHeadersPath = path.join(xcframeworkOutputPath, 'Headers');
  for (const slice of slices) {
    const slicePath = path.join(xcframeworkOutputPath, slice, `${product.name}.framework`);
    const destHeadersPath = path.join(slicePath, 'Headers');

    // Copy headers to slice
    await fs.mkdirp(destHeadersPath);
    await fs.copy(sourceHeadersPath, destHeadersPath);

    // Create module.modulemap and umbrella header
    await createModuleMapWithUmbrellaHeaderFilesAsync(
      slicePath,
      product,
      collectedHeaderFiles,
      hasSwiftTarget,
      targetModuleNames,
      textualHeaderModules
    );

    // Copy Swift-related artifacts if applicable
    if (hasSwiftTarget) {
      await copyGeneratedObjCSwiftHeaderAsync(pkg, spmConfig, product, buildType, slice, slicePath);
    }

    // Copy Swift module interfaces (needed for ABI stability)
    await copySwiftModuleInterfacesAsync(pkg, spmConfig, product, buildType, slice, slicePath);
  }
};

/**
 * Copies resource bundles from SPM build output into each xcframework slice.
 * SPM produces resource bundles named {packageName}_{targetName}.bundle in the
 * build output directory. These need to be placed alongside the .framework in
 * each slice of the xcframework so consumers can find them.
 *
 * @param pkg Package information
 * @param product SPM product
 * @param buildType Build flavor (Debug or Release)
 * @param slices Array of slice names in the xcframework
 * @param xcframeworkOutputPath Path to the xcframework
 */
const copyResourceBundlesIntoXCFrameworkAsync = async (
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  slices: string[],
  xcframeworkOutputPath: string
): Promise<void> => {
  // Find targets that have resources
  const targetsWithResources = product.targets.filter(
    (t) => t.type !== 'framework' && t.resources && t.resources.length > 0
  );

  if (targetsWithResources.length === 0) {
    return;
  }

  const spinner = createAsyncSpinner(`Copying resource bundles`, pkg, product);

  for (const target of targetsWithResources) {
    // SPM names the resource bundle as {packageName}_{targetName}.bundle
    const bundleName = `${pkg.packageName}_${target.name}.bundle`;

    for (const slice of slices) {
      // Map slice name to build folder prefix (e.g., 'ios-arm64' -> 'iphoneos')
      const buildFolderPrefix = getBuildFolderPrefixForSlice(slice);
      if (!buildFolderPrefix) {
        spinner.warn(`Unknown slice ${slice} — skipping resource bundle copy`);
        continue;
      }

      // Find the bundle in the SPM build output
      const buildOutputPath = path.join(
        SPMBuild.getPackageBuildPath(pkg, product, buildType),
        'Build',
        'Products',
        `${buildType}-${buildFolderPrefix}`,
        bundleName
      );

      if (!(await fs.pathExists(buildOutputPath))) {
        spinner.warn(
          `Resource bundle not found at ${path.relative(pkg.path, buildOutputPath)} for slice ${slice}`
        );
        continue;
      }

      // Copy bundle into the xcframework slice (alongside the .framework)
      const destBundlePath = path.join(xcframeworkOutputPath, slice, bundleName);
      await fs.copy(buildOutputPath, destBundlePath, { overwrite: true });

      spinner.info(
        `Copied resource bundle ${chalk.cyan(bundleName)} → ${chalk.cyan(slice + '/' + bundleName)}`
      );
    }
  }

  spinner.succeed(`Copied resource bundles for ${product.name}`);
};

/**
 * Copies pre-built xcframeworks from SPM package dependencies into the output directory.
 *
 * When a product has `spmPackages` dependencies (e.g., lottie-react-native depends on Lottie
 * from lottie-spm), the SPM build fetches these as binary xcframeworks into
 * `SourcePackages/artifacts/<package>/<product>/`. These are dynamic frameworks that the
 * product links against at runtime via @rpath, so they must be distributed alongside
 * the product xcframework and embedded in the app bundle.
 *
 * @param pkg Package information
 * @param product SPM product
 * @param buildType Build flavor (Debug or Release)
 */
const copySPMDependencyXCFrameworksAsync = async (
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  bundleSharedDeps?: boolean
): Promise<void> => {
  // Check if this product has SPM package dependencies
  const spmPackages = product.spmPackages;
  if (!spmPackages || spmPackages.length === 0) {
    return;
  }

  const outputDir = Frameworks.getFrameworksOutputPath(
    pkg.buildPath,
    buildType,
    pkg.outputVersionPrefix
  );
  const buildPath = SPMBuild.getPackageBuildPath(pkg, product, buildType);

  for (const spmPkg of spmPackages) {
    // Derive the SPM package name from the URL (last path component without .git)
    const packageName = spmPkg.packageName || path.basename(spmPkg.url, '.git');
    const productName = spmPkg.productName;

    // Shared deps are normally skipped — they were built as standalone xcframeworks
    // and vendored separately at pod install time. When bundleSharedDeps is true
    // (npm bundling mode), copy them from the shared location into the output dir
    // so they end up in the product tarball.
    if (Frameworks.hasSharedSPMDepFramework(productName, buildType)) {
      if (!bundleSharedDeps) {
        logger.info(
          `⏭️  Skipping shared SPM dep ${chalk.cyan(productName)} (already at shared location)`
        );
        continue;
      }

      const sharedPath = Frameworks.getSharedSPMDepFrameworkPath(productName, buildType);
      const destPath = path.join(outputDir, `${productName}.xcframework`);
      logger.info(
        `📦 Copying shared SPM dep ${chalk.cyan(productName)} from shared location → ${path.relative(pkg.path, destPath)}`
      );
      await fs.remove(destPath);
      execSync(`rsync -a --delete "${sharedPath}/" "${destPath}/"`, { stdio: 'pipe' });
      logger.info(`✅ Bundled shared dep ${productName}.xcframework`);
      continue;
    }

    const xcframeworkName = `${productName}.xcframework`;
    const destXCFrameworkPath = path.join(outputDir, xcframeworkName);
    const productBuildPlatforms = getBuildPlatformsForProduct(product);

    // Collect built frameworks from Build/Products/ — this covers source-built SPM
    // dependencies (e.g., ZXingObjC fetched from a git URL and compiled by Xcode).
    // SPM places dependency frameworks in PackageFrameworks/ subdirectory; check there
    // first, then the top-level build products dir.
    const checkoutDir = path.join(buildPath, 'SourcePackages', 'checkouts', packageName);
    const depFrameworks: { frameworkPath: string; debugSymbolsPath?: string }[] = [];
    for (const buildPlatform of productBuildPlatforms) {
      const buildFolderPrefix = getBuildFolderPrefixForPlatform(buildPlatform);
      const buildProductsDir = path.join(
        buildPath,
        'Build',
        'Products',
        `${buildType}-${buildFolderPrefix}`
      );
      const candidatePaths = [
        path.join(buildProductsDir, 'PackageFrameworks', `${productName}.framework`),
        path.join(buildProductsDir, `${productName}.framework`),
      ];
      const frameworkPath = await findFirstExisting(candidatePaths);
      const dsymPath = await findFirstExisting(candidatePaths.map((p) => `${p}.dSYM`));

      if (frameworkPath) {
        // SPM's PackageFrameworks/ output may lack Headers/ and Modules/ — they live
        // in build intermediates. Enrich the framework so the xcframework is usable
        // as a build dependency with module imports.
        if (await fs.pathExists(checkoutDir)) {
          await enrichFrameworkWithHeaders(
            frameworkPath,
            productName,
            checkoutDir,
            buildPath,
            buildFolderPrefix,
            buildType
          );
        }
        depFrameworks.push({
          frameworkPath,
          debugSymbolsPath: dsymPath ?? undefined,
        });
      }
    }

    if (depFrameworks.length === 0) {
      // No locally-built frameworks found. Check SourcePackages/artifacts/ for binary
      // targets (pre-built xcframeworks distributed via SPM, not compiled locally).
      const artifactsDir = path.join(
        buildPath,
        'SourcePackages',
        'artifacts',
        packageName,
        productName
      );
      const sourceXCFrameworkPath = path.join(artifactsDir, xcframeworkName);

      if (await fs.pathExists(sourceXCFrameworkPath)) {
        logger.info(
          `📦 Copying SPM dependency ${chalk.cyan(xcframeworkName)} → ${path.relative(pkg.path, destXCFrameworkPath)}`
        );
        await fs.remove(destXCFrameworkPath);
        execSync(`rsync -a --delete "${sourceXCFrameworkPath}/" "${destXCFrameworkPath}/"`, {
          stdio: 'pipe',
        });
        logger.info(`✅ Copied ${xcframeworkName} alongside ${product.name}.xcframework`);
      } else {
        logger.warn(
          `⚠️  SPM dependency ${chalk.cyan(productName)} not found in Build/Products/ or SourcePackages/artifacts/`
        );
      }
      continue;
    }

    // Compose the dependency xcframework with only the relevant slices
    logger.info(
      `📦 Composing SPM dependency ${chalk.cyan(xcframeworkName)} → ${path.relative(pkg.path, destXCFrameworkPath)}`
    );
    await fs.remove(destXCFrameworkPath);

    const args = [
      `-create-xcframework`,
      ...depFrameworks.flatMap((f) => {
        const result = ['-framework', f.frameworkPath];
        if (f.debugSymbolsPath) {
          result.push('-debug-symbols', f.debugSymbolsPath);
        }
        return result;
      }),
      `-output`,
      destXCFrameworkPath,
    ];

    const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
      args,
      pkg.path,
      `Composing ${xcframeworkName}`
    );

    if (code !== 0) {
      throw new Error(
        `Failed to compose dependency ${xcframeworkName}: xcodebuild failed with code ${code}:\n${buildError}`
      );
    }

    logger.info(`✅ Composed ${xcframeworkName} alongside ${product.name}.xcframework`);
  }
};

/**
 * Creates a tarball containing the product xcframework and any SPM dependency xcframeworks.
 * The tarball is the source of truth for build-time switching between debug/release flavors.
 *
 * @param pkg Package information
 * @param product SPM product
 * @param buildType Build flavor (Debug or Release)
 */
const createProductTarballAsync = async (
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  bundleSharedDeps?: boolean
): Promise<void> => {
  const outputDir = Frameworks.getFrameworksOutputPath(
    pkg.buildPath,
    buildType,
    pkg.outputVersionPrefix
  );
  const tarballPath = Frameworks.getTarballPath(
    pkg.buildPath,
    product.name,
    buildType,
    pkg.outputVersionPrefix
  );

  // Collect all xcframework directories to include in the tarball
  const xcframeworkEntries = [`${product.name}.xcframework`];

  // Include SPM dependency xcframeworks (e.g., Lottie.xcframework for lottie-react-native)
  // Skip shared deps unless bundleSharedDeps is true (npm bundling mode)
  const spmPackages = product.spmPackages;
  if (spmPackages && spmPackages.length > 0) {
    for (const spmPkg of spmPackages) {
      const depName = spmPkg.productName;
      if (!bundleSharedDeps && Frameworks.hasSharedSPMDepFramework(depName, buildType)) {
        continue;
      }
      const depXcframework = `${depName}.xcframework`;
      if (await fs.pathExists(path.join(outputDir, depXcframework))) {
        xcframeworkEntries.push(depXcframework);
      }
    }
  }

  logger.info(
    `📦 Creating tarball for ${chalk.green(product.name)} (${buildType}): ${xcframeworkEntries.join(', ')}`
  );

  // Create tarball: tar -czf <Product>.tar.gz -C <outputDir> <entries...>
  const tarArgs = ['-czf', tarballPath, '-C', outputDir, ...xcframeworkEntries];
  execSync(`tar ${tarArgs.map((a) => `"${a}"`).join(' ')}`, { stdio: 'pipe' });

  logger.info(
    `✅ Created ${path.basename(tarballPath)} (${xcframeworkEntries.length} framework(s))`
  );
};

/**
 * Creates a module.modulemap file and umbrella header for the given framework slice.
 * For Swift-only frameworks (no ObjC headers), the umbrella header is skipped and the
 * module map only includes the -Swift.h header for ObjC consumers.
 * @param frameworkSlicePath Path to the framework slice
 * @param product SPM product information
 * @param umbrellaHeaderFiles Collected umbrella header files (header names only, flat)
 * @param hasSwiftTarget Whether this product has a Swift target
 * @param targetModuleNames Map of moduleName to header files for creating virtual submodules
 * @param textualHeaderModules Set of module names that should use textual headers (not compiled as part of module)
 */
const createModuleMapWithUmbrellaHeaderFilesAsync = async (
  frameworkSlicePath: string,
  product: SPMProduct,
  umbrellaHeaderFiles: string[],
  hasSwiftTarget: boolean = false,
  targetModuleNames: Map<string, string[]> = new Map(),
  textualHeaderModules: Set<string> = new Set()
): Promise<void> => {
  const hasObjCHeaders = umbrellaHeaderFiles.length > 0;
  const productName = product.name;

  // If no ObjC headers and no Swift target, nothing to generate
  if (!hasObjCHeaders && !hasSwiftTarget) {
    return;
  }

  const umbrellaName = `${productName}_umbrella.h`;

  // Check if product has textualHeaders patterns configured
  const textualHeaderPatterns = product.textualHeaders ?? [];
  const hasTextualPatterns = textualHeaderPatterns.length > 0;

  // Check if product has excludeFromUmbrella patterns configured
  const excludeFromUmbrellaPatterns = product.excludeFromUmbrella ?? [];

  // Helper to check if a header matches any pattern in a list
  const matchesPattern = (headerName: string, patterns: string[]): boolean => {
    if (patterns.length === 0) return false;
    return patterns.some((pattern) => {
      // Convert glob pattern to regex
      // First escape all regex special characters, then convert glob wildcards
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${regexPattern}$`).test(headerName);
    });
  };

  // Helper to check if a header matches any textual pattern
  const isTextualHeader = (headerName: string): boolean => {
    return matchesPattern(headerName, textualHeaderPatterns);
  };

  // Helper to check if a header should be excluded from umbrella
  const isExcludedFromUmbrella = (headerName: string): boolean => {
    return matchesPattern(headerName, excludeFromUmbrellaPatterns);
  };

  // Build the module map content
  let moduleMapContent = '';

  moduleMapContent += `framework module ${productName} {\n`;

  // Add `use` directives for external dependencies (like React)
  // This tells the module system that this module requires these dependencies to compile
  const externalDeps = product.externalDependencies ?? [];
  for (const dep of externalDeps) {
    // Only add `use` for React - it's needed for headers that import React types
    if (dep === 'React') {
      moduleMapContent += `    use React\n`;
    }
  }

  // If we have textual header patterns, we need to list headers explicitly instead of using umbrella
  if (hasTextualPatterns && hasObjCHeaders) {
    // Separate headers into regular and textual
    const regularHeaders: string[] = [];
    const textualHeaders: string[] = [];

    for (const header of umbrellaHeaderFiles) {
      if (isTextualHeader(header)) {
        textualHeaders.push(header);
      } else {
        regularHeaders.push(header);
      }
    }

    // If ALL headers are textual, we need to add an empty umbrella header
    // so Swift can import the module. A module with only textual headers
    // has no compiled content and Swift can't import it.
    if (regularHeaders.length === 0 && textualHeaders.length > 0) {
      moduleMapContent += `    umbrella header "${umbrellaName}"\n`;
    } else {
      // Add regular headers
      for (const header of regularHeaders) {
        moduleMapContent += `    header "${header}"\n`;
      }
    }

    // Add textual headers (won't be compiled as part of module)
    for (const header of textualHeaders) {
      moduleMapContent += `    textual header "${header}"\n`;
    }
  } else if (hasObjCHeaders) {
    // Use umbrella header when no textual patterns are specified
    moduleMapContent += `    umbrella header "${umbrellaName}"\n`;
  }

  // If there's a Swift target, we need to include the generated Swift header
  // so @objc Swift classes are visible when importing the module from ObjC
  if (hasSwiftTarget) {
    moduleMapContent += `    header "${productName}-Swift.h"\n`;
  }

  moduleMapContent += `
    export *`;

  // Only add inferred submodules when we have an umbrella header (no textual patterns)
  // The `module * { export * }` syntax requires an umbrella to enumerate submodules from
  if (hasObjCHeaders && !hasTextualPatterns) {
    moduleMapContent += `
    module * { export * }`;
  }

  // Define submodules for targets with different moduleNames
  // These are nested inside the main framework module so their types are
  // available when importing the main module (e.g., TypedArrayKind from ExpoModulesJSI
  // is available when you `import ExpoModulesCore`)
  // We list headers explicitly since umbrella directory paths can be problematic
  // Note: We do NOT use "explicit" because we want the submodule's types to be
  // automatically available when importing the parent module
  for (const [moduleName, headers] of targetModuleNames.entries()) {
    if (headers.length > 0) {
      // Check if this module should use textual headers (for C++ headers that can't be compiled independently)
      // This can come from either: 1) moduleMapContent in the target, or 2) product.textualHeaders patterns
      const moduleMarkedAsTextual = textualHeaderModules.has(moduleName);

      moduleMapContent += `

    module ${moduleName} {`;
      // List each header explicitly with proper path
      for (const header of headers) {
        // Check both module-level setting and individual header against textualHeaders patterns
        // The full path is "moduleName/header.h" so we check both the full path and just the filename
        const headerPath = `${moduleName}/${header}`;
        const useTextualForHeader =
          moduleMarkedAsTextual || isTextualHeader(headerPath) || isTextualHeader(header);

        if (useTextualForHeader) {
          moduleMapContent += `
        textual header "${moduleName}/${header}"`;
        } else {
          moduleMapContent += `
        header "${moduleName}/${header}"`;
        }
      }
      moduleMapContent += `
        export *
    }`;
    }
  }

  // Re-export all submodule contents in the main module
  // This ensures that types from submodules (like JavaScriptRuntime) are
  // visible when importing the main module
  if (targetModuleNames.size > 0) {
    moduleMapContent += `

    // Re-export submodule types for proper Swift inheritance resolution`;
    for (const [moduleName] of targetModuleNames.entries()) {
      moduleMapContent += `
    export ${moduleName}`;
    }
  }

  moduleMapContent += `
}
`;

  // Also create top-level module aliases for CocoaPods compatibility
  // This allows `#import <ExpoModulesJSI/Header.h>` to work
  for (const [moduleName, headers] of targetModuleNames.entries()) {
    if (headers.length > 0) {
      moduleMapContent += `
module ${moduleName} {
    export ${productName}.${moduleName}
}
`;
    }
  }

  const moduleMapPath = path.join(frameworkSlicePath, 'Modules', 'module.modulemap');
  await fs.mkdirp(path.dirname(moduleMapPath));
  await fs.writeFile(moduleMapPath, moduleMapContent, 'utf8');

  // Create the umbrella header file only if we have ObjC headers
  if (hasObjCHeaders) {
    // Filter out headers excluded from umbrella
    const umbrellaIncludedHeaders = umbrellaHeaderFiles.filter((h) => !isExcludedFromUmbrella(h));

    // Check if all included headers are textual - if so, create an empty umbrella
    const allHeadersTextual =
      hasTextualPatterns && umbrellaIncludedHeaders.every((h) => isTextualHeader(h));

    let umbrellaHeaderContent: string;
    if (allHeadersTextual || umbrellaIncludedHeaders.length === 0) {
      // Empty umbrella header - just a comment explaining why it's empty
      // This is needed because Swift requires at least one non-textual header
      // for the module to be importable
      umbrellaHeaderContent = `// This is an empty umbrella header for Swift module compatibility.
// All actual headers are marked as textual because they have dependencies
// on external modules (like React) that aren't available at module compile time.
// The textual headers will be included when needed by the including source file.
`;
    } else {
      // Headers in subdirectories (other modules) are excluded from main umbrella
      // Use quoted imports for headers in the same directory
      // Filter out textual headers from umbrella - they're not compiled as part of module
      umbrellaHeaderContent = umbrellaIncludedHeaders
        .filter((h) => !isTextualHeader(h))
        .map((headerFile) => `#import "${headerFile}"`)
        .join('\n');
    }

    const umbrellaHeaderPath = path.join(frameworkSlicePath, 'Headers', `${umbrellaName}`);
    await fs.writeFile(umbrellaHeaderPath, umbrellaHeaderContent, 'utf8');
  }
};

/**
 * Composes the XCFramework using xcodebuild.
 * @param pkg Package information
 * @param product SPM product information
 * @param frameworks Built frameworks to include
 * @param outputFrameworkPath Output path for the composed XCFramework
 */
const composeFrameworkWithXCodeAsync = async (
  pkg: SPMPackageSource,
  product: SPMProduct,
  frameworks: BuiltFramework[],
  outputFrameworkPath: string
): Promise<string[]> => {
  const spinner = createAsyncSpinner(`Building framework...`, pkg, product);

  // Clean output directory
  spinner.info(`Cleaning output directory at ${path.relative(pkg.path, outputFrameworkPath)}...`);
  await fs.remove(outputFrameworkPath);
  await fs.mkdirp(path.dirname(outputFrameworkPath));

  // Run XCode build command with formatted output.
  // dSYMs are embedded inside the xcframework via -debug-symbols so that Xcode
  // copies them alongside the framework slices. Source path remapping plists
  // (UUID plists) are written into these dSYMs at build time by a script phase,
  // enabling lldb to resolve /expo-src/ paths back to local package paths.
  const args = [
    `-create-xcframework`,
    ...frameworks.flatMap((framework) => {
      const result = ['-framework', framework.frameworkPath];
      if (fs.existsSync(framework.symbolsBundlePath)) {
        result.push('-debug-symbols', framework.symbolsBundlePath);
      }
      return result;
    }),
    `-output`,
    outputFrameworkPath,
  ];

  const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
    args,
    pkg.path,
    `Building ${product.name}.xcframework`
  );

  if (code !== 0) {
    throw new SpinnerError(
      `xcodebuild failed with code ${code}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`,
      spinner
    );
  }

  spinner.succeed(`Built framework at ${path.relative(pkg.path, outputFrameworkPath)}`);

  // Find slices in the composed XCFramework - they are the folders inside the .xcframework
  // remember to return only directories, not files - and return their names.
  return (await fs.readdir(outputFrameworkPath)).filter((name) => {
    const fullPath = path.join(outputFrameworkPath, name);
    return fs.statSync(fullPath).isDirectory();
  });
};

/**
 * Collects header files for the given product. The function uses the product definition's
 * include files to locate and copy the headers into the XCFramework's Headers directory.
 * @param pkg Package information
 * @param product SPM product information
 * @returns Collected header file paths, target module names map, and set of modules needing textual headers
 */
const collectAndCopyHeaderFilesFromBuiltFrameworksAsync = async (
  pkg: SPMPackageSource,
  product: SPMProduct,
  frameworkOutputPath: string
) => {
  const spinner = createAsyncSpinner(`Collecting header files`, pkg, product);

  spinner.info('Copying header files...');

  // Create headers directory inside the XCFramework output path
  const frameworkHeadersPath = path.join(frameworkOutputPath, 'Headers');
  await fs.mkdirp(frameworkHeadersPath);

  // Get header files and copy them to the Headers directory
  // Headers with moduleName different from product go into subdirectories
  const headerFilesCollected: string[] = [];
  const targetModuleNames = new Map<string, string[]>(); // moduleName -> header files (with relative paths)
  const textualHeaderModules = new Set<string>(); // modules that need textual headers

  for (const target of product.targets) {
    if (target.type === 'swift' || target.type === 'framework') {
      continue;
    }
    spinner.info(`Processing target ${target.name}...`);

    const targetHeaderFilesPath = SPMGenerator.getHeaderFilesPath(pkg, product, target);

    // Recursively collect all header files including from subdirectories
    const collectHeadersRecursively = async (
      dir: string,
      relativePath: string = ''
    ): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const headers: string[] = [];

      for (const entry of entries) {
        const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          // Recurse into subdirectory
          const subHeaders = await collectHeadersRecursively(
            path.join(dir, entry.name),
            entryRelativePath
          );
          headers.push(...subHeaders);
        } else if (entry.name.endsWith('.h')) {
          headers.push(entryRelativePath);
        }
      }

      return headers;
    };

    const headerFiles = await collectHeadersRecursively(targetHeaderFilesPath);

    // Check if this target has a moduleName that differs from the product name
    const moduleName = target.moduleName ? target.moduleName : product.name;
    const useSubdirectory = moduleName !== product.name;

    // Check if this target has moduleMapContent with 'textual header' - if so, mark the module
    // as needing textual headers in the final framework modulemap
    if (
      useSubdirectory &&
      'moduleMapContent' in target &&
      target.moduleMapContent?.includes('textual header')
    ) {
      textualHeaderModules.add(moduleName);
      spinner.info(`Target ${target.name} uses textual headers for module ${moduleName}`);
    }

    for (const headerFile of headerFiles) {
      const sourceHeaderFilePath = path.join(targetHeaderFilesPath, headerFile);
      let destHeaderFilePath: string;

      spinner.info(`Copying header file ${path.basename(headerFile)}...`);

      if (useSubdirectory) {
        // Put in subdirectory: Headers/ModuleName/Header.h (preserving relative path)
        const subdirPath = path.join(frameworkHeadersPath, moduleName);
        await fs.mkdirp(subdirPath);
        destHeaderFilePath = path.join(subdirPath, headerFile);
        // Ensure subdirectories exist (e.g., Headers/rnscreens/utils/)
        await fs.mkdirp(path.dirname(destHeaderFilePath));

        // Track headers for this moduleName (with relative path preserved)
        if (!targetModuleNames.has(moduleName)) {
          targetModuleNames.set(moduleName, []);
        }
        targetModuleNames.get(moduleName)!.push(headerFile);
      } else {
        // Flat structure: Headers/Header.h
        destHeaderFilePath = path.join(frameworkHeadersPath, headerFile);
        // Ensure subdirectories exist
        await fs.mkdirp(path.dirname(destHeaderFilePath));
        headerFilesCollected.push(headerFile);
      }

      await fs.copy(sourceHeaderFilePath, destHeaderFilePath);
    }
  }

  // Post-process all headers to rewrite imports for subdirectory modules
  // This is needed because frameworks don't support angled includes for
  // subdirectory headers when consumed via CocoaPods
  spinner.info('Rewriting header imports for submodules...');
  await rewriteHeaderImportsForSubmodulesAsync(frameworkHeadersPath, targetModuleNames);

  spinner.succeed(`Copied header files for ${product.name}`);

  return { headerFiles: headerFilesCollected, targetModuleNames, textualHeaderModules };
};

/**
 * Derives the xcodebuild build folder prefix from an xcframework slice name.
 * Slice names follow patterns like: 'ios-arm64', 'ios-arm64_x86_64-simulator', 'macos-arm64_x86_64', etc.
 * @param slice The xcframework slice name
 * @returns The build folder prefix (e.g., 'iphoneos', 'iphonesimulator', 'macosx') or undefined if unknown
 */
const getBuildFolderPrefixForSlice = (slice: string): string | undefined => {
  const isSimulator = slice.endsWith('-simulator');
  // Extract OS from slice name (e.g., 'ios' from 'ios-arm64' or 'ios-arm64_x86_64-simulator')
  const osMatch = slice.match(/^(ios|macos|tvos|visionos)/);
  if (!osMatch) {
    return undefined;
  }
  const os = osMatch[1];
  switch (os) {
    case 'ios':
      return isSimulator ? 'iphonesimulator' : 'iphoneos';
    case 'macos':
      return 'macosx';
    case 'tvos':
      return isSimulator ? 'appletvsimulator' : 'appletvos';
    case 'visionos':
      return isSimulator ? 'visionossimulator' : 'visionos';
    default:
      return undefined;
  }
};

/**
 * Copies the generated ObjC header for Swift types (ProductName-Swift.h) from the build output
 * into the xcframework slice. This header exposes @objc Swift classes/methods to ObjC/C++ code.
 * @param pkg Package information
 * @param spmConfig SPM configuration
 * @param product SPM product information
 * @param buildType Build flavor
 * @param slice The xcframework slice name (e.g., "ios-arm64")
 * @param slicePath Path to the framework inside the slice
 */
const copyGeneratedObjCSwiftHeaderAsync = async (
  pkg: SPMPackageSource,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slice: string,
  slicePath: string
): Promise<void> => {
  const spinner = createAsyncSpinner(
    `Copying generated ObjC Swift header for ${product.name} (${slice})`,
    pkg,
    product
  );

  // Map slice name to build folder prefix
  const buildFolderPrefix = getBuildFolderPrefixForSlice(slice);
  if (!buildFolderPrefix) {
    spinner.fail(`Unknown xcframework slice: ${slice}, skipping ObjC Swift header copy`);
    return;
  }

  // The header is generated in the Intermediates/GeneratedModuleMaps directory
  const generatedObjCHeaderName = `${product.name}-Swift.h`;
  const generatedModuleMapsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg, product, buildType),
    'Build',
    'Intermediates.noindex',
    `GeneratedModuleMaps-${buildFolderPrefix}`,
    generatedObjCHeaderName
  );

  if (!(await fs.pathExists(generatedModuleMapsPath))) {
    spinner.warn(`Generated ObjC Swift header not found at ${generatedModuleMapsPath}`);
    return;
  }

  // Copy to Headers directory
  const destObjCHeaderPath = path.join(slicePath, 'Headers', generatedObjCHeaderName);
  await fs.copy(generatedModuleMapsPath, destObjCHeaderPath);

  // Post-process the header to fix internal SPM module imports and remove React imports
  await fixObjCSwiftHeaderModuleReferencesAsync(destObjCHeaderPath, spmConfig);

  spinner.succeed(`Copied generated ObjC Swift header: ${generatedObjCHeaderName}`);
};

/**
 * Copies Swift module interface files (.swiftinterface, .swiftmodule, etc.) from the build output
 * into the xcframework slice. This is required for other Swift modules to import this framework.
 * The Swift target should have the same name as the product for proper module naming.
 * @param pkg Package information
 * @param spmConfig SPM configuration
 * @param product SPM product information
 * @param buildType Build flavor
 * @param slice The xcframework slice name (e.g., "ios-arm64")
 * @param slicePath Path to the framework inside the slice
 */
const copySwiftModuleInterfacesAsync = async (
  pkg: SPMPackageSource,
  spmConfig: SPMConfig,
  product: SPMProduct,
  buildType: BuildFlavor,
  slice: string,
  slicePath: string
): Promise<void> => {
  // Find Swift targets in the product
  const swiftTarget = product.targets.find((target) => target?.type === 'swift');

  if (!swiftTarget) {
    return;
  }

  let spinner = createAsyncSpinner(`Copying Swift module interfaces for (${slice})`, pkg, product);

  // Map slice name to build folder prefix
  const buildFolderPrefix = getBuildFolderPrefixForSlice(slice);
  if (!buildFolderPrefix) {
    spinner.fail(`Unknown xcframework slice: ${slice}, skipping Swift module copy`);
    return;
  }

  // Construct path to the built swiftmodule directory
  // The swiftmodule is named after the Swift target (which should match the product name)
  const buildProductsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg, product, buildType),
    'Build',
    'Products',
    `${buildType}-${buildFolderPrefix}`
  );

  const sourceSwiftModulePath = path.join(buildProductsPath, `${swiftTarget.name}.swiftmodule`);

  if (!(await fs.pathExists(sourceSwiftModulePath))) {
    spinner.fail(
      `Swift module not found at ${sourceSwiftModulePath}, skipping swiftinterface copy`
    );
    return;
  }

  spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);

  // Destination path: Framework/Modules/ProductName.swiftmodule
  const destSwiftModulePath = path.join(slicePath, 'Modules', `${product.name}.swiftmodule`);
  await fs.mkdirp(destSwiftModulePath);

  spinner = createAsyncSpinner(
    `Copying Swift module interfaces for ${product.name} (${slice})`,
    pkg,
    product
  );

  // Copy all files from the source swiftmodule directory
  const swiftModuleFiles = await fs.readdir(sourceSwiftModulePath);
  for (const file of swiftModuleFiles) {
    const sourceFile = path.join(sourceSwiftModulePath, file);

    // Skip directories (like Project/)
    if ((await fs.stat(sourceFile)).isDirectory()) {
      continue;
    }

    // Skip binary .swiftmodule files - they are compiler-version specific and contain
    // hardcoded internal SPM module references. For distributable frameworks built with
    // BUILD_LIBRARY_FOR_DISTRIBUTION=YES, only the textual .swiftinterface files should
    // be included as they support library evolution and cross-compiler compatibility.
    if (file.endsWith('.swiftmodule')) {
      continue;
    }

    // Copy files as-is since the directory name determines the module name
    const destFile = path.join(destSwiftModulePath, file);
    spinner.info(`Copying Swift module interface file: ${path.basename(file)}...`);
    await fs.copy(sourceFile, destFile);

    // Post-process .swiftinterface files to fix internal module references
    if (file.endsWith('.swiftinterface')) {
      await fixSwiftInterfaceModuleReferencesAsync(destFile, spmConfig);
    }
  }

  spinner.succeed(`Copied Swift module interfaces for ${product.name} (${slice})`);
};

/**
 * Post-processes a .swiftinterface file to:
 * 1. Remap internal SPM target names to their product names
 *    (e.g., ExpoModulesCore_ios_objc -> ExpoModulesCore)
 *
 * @param swiftInterfaceFilePath Path to the .swiftinterface file
 * @param spmConfig SPM configuration containing product/target mappings
 */
const fixSwiftInterfaceModuleReferencesAsync = async (
  swiftInterfaceFilePath: string,
  spmConfig: SPMConfig
): Promise<void> => {
  // Read the swiftinterface file
  let content = await fs.readFile(swiftInterfaceFilePath, 'utf8');
  let modified = false;

  // Remap internal SPM target imports to product names
  // e.g., @_exported import ExpoModulesCore_ios_objc -> @_exported import ExpoModulesCore
  for (const product of spmConfig.products) {
    for (const target of product.targets) {
      if (target.name === product.name) {
        continue; // Skip targets that have same name as product
      }

      // Replace @_exported import statements
      const exportedImportPattern = new RegExp(`^@_exported import ${target.name}\\s*$`, 'gm');
      const exportedReplaced = content.replace(
        exportedImportPattern,
        `@_exported import ${product.name}`
      );
      if (exportedReplaced !== content) {
        content = exportedReplaced;
        modified = true;
      }

      // Replace regular import statements
      const importPattern = new RegExp(`^import ${target.name}\\s*$`, 'gm');
      const importReplaced = content.replace(importPattern, `import ${product.name}`);
      if (importReplaced !== content) {
        content = importReplaced;
        modified = true;
      }

      // Replace module-qualified type references
      // e.g., ExpoModulesCore_ios_objc.TypeName -> ExpoModulesCore.TypeName
      const qualifiedPattern = new RegExp(`\\b${target.name}\\.`, 'g');
      const qualifiedReplaced = content.replace(qualifiedPattern, `${product.name}.`);
      if (qualifiedReplaced !== content) {
        content = qualifiedReplaced;
        modified = true;
      }
    }
  }

  // Write back if modified
  if (modified) {
    await fs.writeFile(swiftInterfaceFilePath, content, 'utf8');
  }
};

/**
 * Post-processes a generated ProductName-Swift.h header to remove or fix internal SPM
 * module imports. The generated header may contain @import statements for internal SPM
 * target modules (e.g., @import ExpoModulesCore_ios_objc) that don't exist when the
 * framework is consumed via CocoaPods.
 *
 * @param swiftHeaderPath Path to the ProductName-Swift.h file
 * @param spmConfig SPM configuration containing product/target mappings
 */
const fixObjCSwiftHeaderModuleReferencesAsync = async (
  swiftHeaderPath: string,
  spmConfig: SPMConfig
): Promise<void> => {
  // Determine which product this header belongs to based on its path
  const pathParts = swiftHeaderPath.split('/');
  const frameworkName = pathParts.find((p) => p.endsWith('.framework'))?.replace('.framework', '');
  const currentProduct = frameworkName || '';

  // Read the header file
  let content = await fs.readFile(swiftHeaderPath, 'utf8');
  let modified = false;

  // Remove @import statements for internal SPM targets
  // These modules don't exist when consumed via CocoaPods
  for (const product of spmConfig.products) {
    for (const target of product.targets) {
      if (target.name === product.name) {
        continue; // Skip targets that have same name as product
      }

      // Match @import TargetName; statements
      const importPattern = new RegExp(`^@import ${target.name};\\s*$`, 'gm');
      if (product.name === currentProduct) {
        // Same framework - just remove the import, the types are already available
        const replaced = content.replace(
          importPattern,
          `// Removed internal target import: ${target.name}`
        );
        if (replaced !== content) {
          content = replaced;
          modified = true;
        }
      } else {
        // Different framework - replace with import of the product module
        const replaced = content.replace(importPattern, `@import ${product.name};`);
        if (replaced !== content) {
          content = replaced;
          modified = true;
        }
      }
    }
  }

  // Remove @import React - React.xcframework has VFS overlays that cause issues
  const reactImportPattern = /^@import React;\s*$/gm;
  const reactReplaced = content.replace(reactImportPattern, '// Removed: @import React;');
  if (reactReplaced !== content) {
    content = reactReplaced;
    modified = true;
  }

  // Write back if modified
  if (modified) {
    await fs.writeFile(swiftHeaderPath, content, 'utf8');
  }
};

/**
 * Rewrites header imports for submodule headers in all headers within the framework.
 * This is necessary because frameworks don't properly support angled includes for
 * subdirectory headers when consumed via CocoaPods.
 *
 * For each submodule (e.g., ExpoModulesJSI), this converts:
 *   - In main headers (Headers/*.h):
 *       #import <ExpoModulesJSI/Header.h> -> #import "ExpoModulesJSI/Header.h"
 *   - In subdirectory headers (Headers/ExpoModulesJSI/*.h):
 *       #import <ExpoModulesJSI/Header.h> -> #import "Header.h"
 *
 * @param headersPath Path to the Headers directory in the framework
 * @param targetModuleNames Map of moduleName to header files for submodules
 */
const rewriteHeaderImportsForSubmodulesAsync = async (
  headersPath: string,
  targetModuleNames: Map<string, string[]>
): Promise<void> => {
  // Skip if no submodules
  if (targetModuleNames.size === 0) {
    return;
  }

  // Get all module names that need rewriting
  const moduleNames = Array.from(targetModuleNames.keys());

  // Process main headers (Headers/*.h)
  const mainHeaders = (await fs.readdir(headersPath)).filter(
    (f) => f.endsWith('.h') && !targetModuleNames.has(f)
  );

  for (const headerFile of mainHeaders) {
    const headerPath = path.join(headersPath, headerFile);
    let content = await fs.readFile(headerPath, 'utf8');
    let modified = false;

    for (const moduleName of moduleNames) {
      // Rewrite #import <ModuleName/Header.h> to #import "ModuleName/Header.h"
      const angledImportPattern = new RegExp(`#(import|include)\\s*<${moduleName}/([^>]+)>`, 'g');
      const newContent = content.replace(angledImportPattern, `#$1 "${moduleName}/$2"`);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(headerPath, content, 'utf8');
    }
  }

  // Process subdirectory headers (Headers/ModuleName/*.h)
  for (const moduleName of moduleNames) {
    const subdirPath = path.join(headersPath, moduleName);
    if (!(await fs.pathExists(subdirPath))) {
      continue;
    }

    const subdirHeaders = (await fs.readdir(subdirPath)).filter((f) => f.endsWith('.h'));

    for (const headerFile of subdirHeaders) {
      const headerPath = path.join(subdirPath, headerFile);
      const content = await fs.readFile(headerPath, 'utf8');

      // Rewrite #import <ModuleName/Header.h> to #import "Header.h" (sibling imports)
      const angledImportPattern = new RegExp(`#(import|include)\\s*<${moduleName}/([^>]+)>`, 'g');
      const newContent = content.replace(angledImportPattern, '#$1 "$2"');

      if (newContent !== content) {
        await fs.writeFile(headerPath, newContent, 'utf8');
      }
    }
  }
};
