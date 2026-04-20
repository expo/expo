import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import { BuildFlavor } from './Prebuilder.types';
import {
  BuildPlatform,
  ProductPlatform,
  SPMPackageDependencyConfig,
  SPMProduct,
} from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';
import { createAsyncSpinner } from './Utils';
import { spawnXcodeBuildWithSpinner } from './XCodeRunner';
import { getExpoRepositoryRootDir } from '../Directories';
import logger from '../Logger';

export const SPMBuild = {
  /**
   * Builds the Swift package using xcodebuild.
   * @param pkg Pacakge to build
   * @param product Product to build
   * @param buildType Build flavor (Debug or Release)
   * @param platform Optional activate platform to build for
   * @param hermesIncludeDirs Optional hermes include directories to pass via xcodebuild flags
   */
  buildSwiftPackageAsync: async (
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor,
    platform?: BuildPlatform,
    hermesIncludeDirs?: string[]
  ): Promise<void> => {
    logger.info(
      `🏗  Build Package.swift for ${chalk.green(pkg.packageName)}/${chalk.green(product.name)} [${buildType.toLowerCase()}]`
    );

    // Verify that we have a Package.swift file in the package directory
    const packageSwiftPath = SPMGenerator.getSwiftPackagePath(pkg, product);
    if (!fs.existsSync(packageSwiftPath)) {
      throw new Error(`No Package.swift file found in package: ${pkg.packageName}`);
    }

    // Resolve SPM dependencies and apply patches to known problematic packages
    if (product.spmPackages && product.spmPackages.length > 0) {
      await resolveSPMDependenciesAndPatch(path.dirname(packageSwiftPath));
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
      await buildForPlatformAsync(
        pkg,
        product,
        buildType,
        buildPlatform,
        packageSwiftPath,
        hermesIncludeDirs
      );
    }

    logger.info(`🏗  Swift package successfully built.`);
  },

  /**
   * Cleans the build output folder
   * @param pkg Package
   * @param product Product
   * @param buildType Build flavor
   */
  cleanBuildFolderAsync: async (
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor
  ): Promise<void> => {
    const buildFolderToClean = SPMBuild.getPackageBuildPath(pkg, product, buildType);
    logger.info(
      `🧹 Cleaning build folder ${chalk.green(path.relative(pkg.buildPath, buildFolderToClean))}...`
    );
    await fs.remove(buildFolderToClean);
  },

  /**
   * Returns the output path where we'll build the frameworks for the package.
   * Build artifacts are stored under packages/precompile/.build/<package-name>/output/<flavor>/frameworks/<product>/
   * so they survive yarn reinstalls and are centralized.
   * @param pkg Package
   * @param product Product
   * @param buildType Build flavor
   * @returns Output path
   */
  getPackageBuildPath: (pkg: SPMPackageSource, product: SPMProduct, buildType: BuildFlavor) => {
    return path.join(pkg.buildPath, 'output', buildType.toLowerCase(), 'frameworks', product.name);
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
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor,
    buildPlatform: BuildPlatform
  ) => {
    const buildOutputPath = SPMBuild.getPackageBuildPath(pkg, product, buildType);

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
    pkg: SPMPackageSource,
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
    pkg: SPMPackageSource,
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
export const getBuildPlatformsForProduct = (
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
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  buildPlatform: BuildPlatform,
  hermesIncludeDirs?: string[]
): string[] => {
  const derivedDataPath = SPMBuild.getPackageBuildPath(pkg, product, buildType);
  const containsSwiftTargets = product.targets.some((target) => target?.type === 'swift');

  // Remap absolute build paths to a canonical /expo-src prefix in DWARF debug info.
  // This ensures dSYMs are portable across machines — the canonical prefix is resolved
  // to the consumer's local package path at build time via UUID plists.
  // Two separate flags are needed for Swift targets:
  //   -debug-prefix-map: remaps paths in Swift's own DWARF output
  //   -Xcc -fdebug-prefix-map: remaps paths in Clang calls made by Swift (bridging headers, etc.)
  const repoRoot = getExpoRepositoryRootDir();

  // Per-target debug prefix maps: remap staging directory paths to canonical source paths.
  // During the SPM build, source files are symlinked into a staging directory:
  //   <buildPath>/generated/<productName>/<targetName>/
  // The compiler records this staging path (not the symlink target) as DW_AT_comp_dir.
  // These maps ensure DWARF records the canonical /expo-src/<pkgPath>/<target.path>/
  // prefix instead, so the resolve-dsym-sourcemaps.js script can map them to the
  // consumer's local package paths.
  const stagingBase = path.resolve(pkg.buildPath, 'generated', product.name);
  const cTargetPrefixMaps: string[] = [];
  const swiftTargetPrefixMaps: string[] = [];
  for (const target of product.targets) {
    // Skip binary framework targets (no source files to compile)
    if (target.type === 'framework') continue;
    // Skip targets with generated source in .build/ (not from actual package source)
    if (target.path.startsWith('.build/')) continue;

    const stagingTargetPath = path.join(stagingBase, target.name);
    const canonicalPath = `/expo-src/packages/${pkg.packageName}/${target.path}`;

    // Trailing '/' ensures directory-boundary matching — without it, a target named
    // "ExpoModulesCore" would also match "ExpoModulesCore_ios_objc" as a string prefix.
    cTargetPrefixMaps.push(`-fdebug-prefix-map=${stagingTargetPath}/=${canonicalPath}/`);
    swiftTargetPrefixMaps.push(`-debug-prefix-map ${stagingTargetPath}/=${canonicalPath}/`);
  }

  // General repo root map as catch-all
  const debugPrefixMap = `-fdebug-prefix-map=${repoRoot}=/expo-src`;
  const swiftDebugPrefixMap = `-debug-prefix-map ${repoRoot}=/expo-src`;

  // Build compound flag strings: repo root map FIRST (catch-all), per-target maps LAST (override).
  // Clang applies -fdebug-prefix-map in reverse order (last on command line wins), so the
  // more specific per-target maps must come last to take priority over the general repo root map.
  const allCPrefixMaps = [debugPrefixMap, ...cTargetPrefixMaps].join(' ');
  const allSwiftPrefixMaps = [swiftDebugPrefixMap, ...swiftTargetPrefixMaps].join(' ');
  const allXccPrefixMaps = [debugPrefixMap, ...cTargetPrefixMaps].map((m) => `-Xcc ${m}`).join(' ');

  // Build extra include flags for headers that can't be in Package.swift
  // (e.g. Hermes headers that conflict with React VFS jsi/ headers)
  const extraIncludeFlags = (hermesIncludeDirs ?? []).map((dir) => `-I${dir}`);

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
    // Mirror Xcode's default project-level preprocessor definitions for each configuration.
    // SPM targets do NOT inherit these automatically (unlike .xcodeproj targets), so we must
    // set them explicitly. Without NDEBUG in Release, React Native headers expose non-inline
    // symbols (e.g. Sealable) that the Release React.xcframework doesn't export.
    ...(buildType === 'Release'
      ? ['GCC_PREPROCESSOR_DEFINITIONS=$(inherited) NDEBUG=1 NS_BLOCK_ASSERTIONS=1']
      : ['GCC_PREPROCESSOR_DEFINITIONS=$(inherited) DEBUG=1']),
    'DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
    `OTHER_CFLAGS=$(inherited) ${allCPrefixMaps}${extraIncludeFlags.length > 0 ? ' ' + extraIncludeFlags.join(' ') : ''}`,
    `OTHER_CPLUSPLUSFLAGS=$(inherited) ${allCPrefixMaps}${extraIncludeFlags.length > 0 ? ' ' + extraIncludeFlags.join(' ') : ''}`,
    ...(containsSwiftTargets
      ? [
          `OTHER_SWIFT_FLAGS=$(inherited) ${allSwiftPrefixMaps} ${allXccPrefixMaps}${
            extraIncludeFlags.length > 0
              ? ' ' + extraIncludeFlags.map((f) => `-Xcc ${f}`).join(' ')
              : ''
          }`,
        ]
      : []),
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
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  buildPlatform: BuildPlatform,
  packageSwiftPath: string,
  hermesIncludeDirs?: string[]
): Promise<void> => {
  const args = buildXcodeBuildArgs(pkg, product, buildType, buildPlatform, hermesIncludeDirs);

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
 * Resolves SPM package dependencies using spawn with a spinner for progress feedback.
 * Shows which packages are being fetched/resolved in real time.
 */
async function resolveSPMDependenciesAsync(packageDir: string): Promise<void> {
  const spinner = createAsyncSpinner('📦 Resolving SPM package dependencies...');

  return new Promise<void>((resolve, reject) => {
    const proc = spawn('swift', ['package', 'resolve'], {
      cwd: packageDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        const trimmed = line.trim();
        if (trimmed) {
          spinner.info(`📦 ${trimmed}`);
        }
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      // SPM writes progress to stderr (Fetching, Computing, Resolving, etc.)
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) {
          spinner.info(`📦 ${trimmed}`);
        }
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        spinner.succeed('📦 SPM package dependencies resolved.');
        resolve();
      } else {
        spinner.fail('📦 Failed to resolve SPM package dependencies.');
        reject(new Error(`swift package resolve failed with code ${code}:\n${stderr}`));
      }
    });
  });
}

/**
 * Resolves SPM package dependencies (swift package resolve) and applies
 * source patches to known problematic packages that break under
 * BUILD_LIBRARY_FOR_DISTRIBUTION=YES (library evolution).
 */
async function resolveSPMDependenciesAndPatch(packageDir: string): Promise<void> {
  // Resolve SPM dependencies first
  await resolveSPMDependenciesAsync(packageDir);

  // Patch Reachability.swift: module/class name collision breaks .swiftinterface generation.
  // The typealiases `(Reachability) -> ()` expand to `(Reachability.Reachability) -> ()`
  // in the module interface, which is ambiguous. We rewrite them using Void return syntax.
  const reachabilitySource = path.join(
    packageDir,
    '.build',
    'checkouts',
    'Reachability.swift',
    'Sources',
    'Reachability',
    'Reachability.swift'
  );

  if (fs.existsSync(reachabilitySource)) {
    let content = fs.readFileSync(reachabilitySource, 'utf8');

    // Fix library evolution .swiftinterface issue: the module and class are both
    // named "Reachability", so the compiler emits `Reachability.Reachability` in
    // the interface which is ambiguous inside the class body. We add a module-level
    // typealias and rewrite the class typealiases to reference it instead.
    if (
      content.includes('public typealias NetworkReachable = (Reachability) -> ()') &&
      !content.includes('public typealias _ReachabilityRef')
    ) {
      // Add module-level typealias before the class definition
      content = content.replace(
        /^(public class Reachability)/m,
        'public typealias _ReachabilityRef = Reachability\n\n$1'
      );
      // Rewrite the class-level typealiases to use the module-level alias
      content = content.replace(
        'public typealias NetworkReachable = (Reachability) -> ()',
        'public typealias NetworkReachable = (_ReachabilityRef) -> ()'
      );
      content = content.replace(
        'public typealias NetworkUnreachable = (Reachability) -> ()',
        'public typealias NetworkUnreachable = (_ReachabilityRef) -> ()'
      );
      fs.writeFileSync(reachabilitySource, content, 'utf8');
      logger.info('🩹 Patched Reachability.swift (library evolution typealias fix)');
    }
  }
}

/**
 * Maps a ProductPlatform to an array of BuildPlatforms
 */
export const getBuildPlatformsFromProductPlatform = (
  platform: ProductPlatform
): BuildPlatform[] => {
  switch (platform) {
    case 'iOS(.v15)':
    case 'iOS(.v16)':
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

/**
 * Normalizes a git URL for comparison (strips trailing .git and lowercases).
 */
function normalizeGitUrl(url: string): string {
  return url.replace(/\.git$/, '').toLowerCase();
}

/**
 * Detects which of the shared SPM dependencies are also dependencies of a given checkout.
 * Parses the checkout's Package.swift for `.package(url:)` entries and matches them
 * against the full set of shared deps by URL.
 *
 * @returns Array of productNames that are both shared deps and dependencies of this checkout
 */
function getSharedInterDeps(
  checkoutPkgSwift: string,
  allSharedDeps: Map<string, SPMPackageDependencyConfig>
): string[] {
  // Extract all .package(url: "...") URLs from the checkout's Package.swift
  const urlPattern = /\.package\(\s*url:\s*"([^"]+)"/g;
  const checkoutUrls = new Set<string>();
  let match;
  while ((match = urlPattern.exec(checkoutPkgSwift)) !== null) {
    checkoutUrls.add(normalizeGitUrl(match[1]));
  }

  // Match against shared deps
  const interDeps: string[] = [];
  for (const [productName, dep] of allSharedDeps) {
    if (checkoutUrls.has(normalizeGitUrl(dep.url))) {
      interDeps.push(productName);
    }
  }
  return interDeps;
}

/**
 * Patches a checkout's Package.swift to use pre-built binary targets for shared deps
 * instead of fetching them from source. This prevents duplicate symbols when multiple
 * shared xcframeworks are linked together.
 *
 * Strategy:
 * 1. Remove the `.package(url:)` entry for each shared dep
 * 2. Add a `.binaryTarget(name:, path:)` entry in the targets array
 * The target's `dependencies:` references (e.g., `"SDWebImage"`) resolve automatically
 * since SPM matches by name regardless of whether it's a package product or binary target.
 */
async function patchCheckoutWithSharedDeps(
  pkgSwiftPath: string,
  builtDeps: Map<string, string> // productName → absolute xcframework path (will be made relative)
): Promise<void> {
  let content = await fs.readFile(pkgSwiftPath, 'utf-8');
  const pkgDir = path.dirname(pkgSwiftPath);
  const headerSearchFlags: string[] = [];

  for (const [productName, xcframeworkPath] of builtDeps) {
    // Create a local wrapper package that provides the xcframework as a binary target.
    // This avoids bumping the checkout's swift-tools-version (which causes compatibility
    // issues like strict resource validation and explicit product declarations).
    // The wrapper uses 5.3 (minimum for .binaryTarget) while the checkout stays at its
    // original version and uses .package(path:) to reference it.
    const wrapperDir = path.join(pkgDir, '_deps', productName);
    await fs.mkdirp(wrapperDir);
    // Path must be relative to the wrapper package root
    const xcfwRelativePath = path.relative(wrapperDir, xcframeworkPath);
    await fs.writeFile(
      path.join(wrapperDir, 'Package.swift'),
      `// swift-tools-version:5.3\nimport PackageDescription\nlet package = Package(\n    name: "${productName}",\n    products: [.library(name: "${productName}", targets: ["${productName}"])],\n    targets: [.binaryTarget(name: "${productName}", path: "${xcfwRelativePath}")]\n)\n`,
      'utf-8'
    );

    // Replace .package(url:) with .package(path:) pointing to the local wrapper
    const pkgPattern = new RegExp(
      `\\.package\\(\\s*url:\\s*"[^"]*\\b${productName}\\b[^"]*"[^)]*\\)`,
      'i'
    );
    const relativePath = path.relative(pkgDir, wrapperDir);
    content = content.replace(pkgPattern, `.package(path: "${relativePath}")`);

    // Binary targets don't expose C headers automatically — collect -I flags
    const headersDir = path.join(
      xcframeworkPath,
      'ios-arm64',
      `${productName}.framework`,
      'Headers'
    );
    if (await fs.pathExists(headersDir)) {
      headerSearchFlags.push(`"-I", "${headersDir}"`);
    }
  }

  // Inject -I flags for binary target headers into the main target's cSettings.
  if (headerSearchFlags.length > 0) {
    const flagsStr = `.unsafeFlags([${headerSearchFlags.join(', ')}])`;
    if (content.includes('cSettings:')) {
      content = content.replace(/cSettings:\s*\[/, `cSettings: [\n                ${flagsStr},`);
    } else {
      // Add cSettings before the closing `)` of the main .target
      content = content.replace(
        /(\n(\s*)\)\s*\n\s*\]\s*\n\s*\)\s*)$/,
        `,\n$2    cSettings: [${flagsStr}]$1`
      );
    }
  }

  await fs.writeFile(pkgSwiftPath, content, 'utf-8');
}

/**
 * Copies Headers/ and Modules/ into a framework bundle from build intermediates.
 * SPM's PackageFrameworks/ output only contains the binary — headers and module maps
 * are in the build intermediates. We need them for the xcframework to be usable as
 * a build dependency with `import Module`.
 */
export async function enrichFrameworkWithHeaders(
  frameworkPath: string,
  productName: string,
  checkoutDir: string,
  derivedDataPath: string,
  buildFolderPrefix: string,
  buildType: string
): Promise<void> {
  // 1. Copy public headers from the checkout.
  // SPM packages declare public headers via `publicHeadersPath` in Package.swift,
  // relative to the target's `path:`. We parse both to find the actual headers dir.
  const checkoutPkgSwift = await fs.readFile(path.join(checkoutDir, 'Package.swift'), 'utf-8');

  // Extract target path and publicHeadersPath for the product's target.
  // Find the `.target(` block that contains `name: "<productName>"` by matching
  // from `.target(` through to `publicHeadersPath` or the closing `)`.
  const targetBlockMatch = checkoutPkgSwift.match(
    new RegExp(
      `\\.target\\(\\s*\\n[\\s\\S]*?name:\\s*"${productName}"[\\s\\S]*?(?=\\.target\\(|\\.testTarget\\(|\\.binaryTarget\\(|\\]\\s*[\\n\\r])`
    )
  );
  const targetBlock = targetBlockMatch ? targetBlockMatch[0] : '';
  const targetPathMatch = targetBlock.match(/\bpath:\s*"([^"]+)"/);
  const publicHeadersMatch = targetBlock.match(/publicHeadersPath:\s*"([^"]+)"/);
  const targetPath = targetPathMatch ? targetPathMatch[1] : '.';

  const headersCandidates = [
    // Explicit publicHeadersPath relative to target path
    ...(publicHeadersMatch ? [path.join(checkoutDir, targetPath, publicHeadersMatch[1])] : []),
    // Default SPM conventions
    path.join(checkoutDir, productName, 'include', productName),
    path.join(checkoutDir, productName, 'include'),
    path.join(checkoutDir, targetPath, 'include', productName),
    path.join(checkoutDir, targetPath, 'include'),
    path.join(checkoutDir, 'include', productName),
    path.join(checkoutDir, 'include'),
  ];
  const headersDir = await findFirstExisting(headersCandidates);
  if (headersDir) {
    const destHeaders = path.join(frameworkPath, 'Headers');
    await fs.mkdirp(destHeaders);
    // Copy .h files preserving subdirectory structure (e.g., avif/avif.h).
    // Use -L to follow symlinks (some packages symlink umbrella headers from other dirs).
    // --include='*/' keeps subdirectories, --include='*.h' keeps headers, --exclude='*' drops the rest.
    execSync(
      `rsync -aL --include='*/' --include='*.h' --exclude='*' "${headersDir}/" "${destHeaders}/"`,
      { stdio: 'pipe' }
    );
  }

  // 2. Copy the generated module map
  const modulemapPaths = [
    path.join(
      derivedDataPath,
      'Build',
      'Intermediates.noindex',
      `GeneratedModuleMaps-${buildFolderPrefix}`,
      `${productName}.modulemap`
    ),
    path.join(
      derivedDataPath,
      'Build',
      'Intermediates.noindex',
      `${productName}.build`,
      `${buildType}-${buildFolderPrefix}`,
      `${productName}.build`,
      `${productName}.modulemap`
    ),
    // Fallback: SPM-generated module map in the checkout's public headers directory.
    // For ObjC packages built via SPM, the module map may only exist here when
    // Xcode doesn't copy it to Build/Intermediates.noindex/.
    ...(headersDir ? [path.join(headersDir, 'module.modulemap')] : []),
  ];
  const modulemapPath = await findFirstExisting(modulemapPaths);
  if (modulemapPath) {
    const destModules = path.join(frameworkPath, 'Modules');
    await fs.mkdirp(destModules);
    // Rewrite the xcodebuild-generated modulemap to use the framework's Headers/ directory.
    // The original modulemap may use:
    //   umbrella header "/absolute/path/to/Header.h"  → umbrella header "Header.h"
    //   umbrella "/absolute/path/to/dir"               → umbrella "Headers"
    let modulemapContent = await fs.readFile(modulemapPath, 'utf-8');
    const destHeaders = path.join(frameworkPath, 'Headers');

    // The xcodebuild-generated modulemap uses `module X` but inside a .framework
    // bundle it must be `framework module X` so Clang resolves headers from Headers/.
    modulemapContent = modulemapContent.replace(/^module /m, 'framework module ');

    if (modulemapContent.includes('umbrella header')) {
      // Extract the umbrella header path to decide how to rewrite it.
      const umbrellaPathMatch = modulemapContent.match(/umbrella header "([^"]+)"/);
      if (umbrellaPathMatch && path.isAbsolute(umbrellaPathMatch[1])) {
        // Absolute path (from xcodebuild-generated modulemaps) — strip to just the filename.
        // Relative paths are preserved — they resolve correctly relative to the framework's Headers/ dir.
        const filename = path.basename(umbrellaPathMatch[1]);
        modulemapContent = modulemapContent.replace(
          /umbrella header "[^"]+"/,
          `umbrella header "${filename}"`
        );
      }

      // Copy the umbrella header if not already in Headers/
      const umbrellaMatch = modulemapContent.match(/umbrella header "([^"]+)"/);
      if (umbrellaMatch) {
        const umbrellaName = umbrellaMatch[1];
        const destUmbrella = path.join(destHeaders, umbrellaName);
        if (!(await fs.pathExists(destUmbrella))) {
          const umbrellaSource = await findFirstExisting([
            path.join(checkoutDir, productName, 'Module', umbrellaName),
            path.join(checkoutDir, 'Sources', productName, umbrellaName),
            path.join(checkoutDir, productName, umbrellaName),
          ]);
          if (umbrellaSource) {
            await fs.copy(umbrellaSource, destUmbrella);
          }
        }
      }
    } else {
      // Directory-based umbrella — rewrite to point to the framework's Headers/ dir
      modulemapContent = modulemapContent.replace(/umbrella "[^"]+"/, 'umbrella "Headers"');
    }
    await fs.writeFile(path.join(destModules, 'module.modulemap'), modulemapContent, 'utf-8');
  }

  // 3. Copy Swift module interfaces if they exist (for Swift packages)
  const swiftmoduleDir = path.join(
    derivedDataPath,
    'Build',
    'Intermediates.noindex',
    `${productName}.build`,
    `${buildType}-${buildFolderPrefix}`,
    `${productName}.build`,
    'Objects-normal'
  );
  if (await fs.pathExists(swiftmoduleDir)) {
    for (const arch of await fs.readdir(swiftmoduleDir)) {
      const swiftinterface = path.join(swiftmoduleDir, arch, `${productName}.swiftinterface`);
      if (await fs.pathExists(swiftinterface)) {
        const destSwiftmodule = path.join(frameworkPath, 'Modules', `${productName}.swiftmodule`);
        await fs.mkdirp(destSwiftmodule);
        await fs.copy(
          swiftinterface,
          path.join(destSwiftmodule, `${arch}-apple-ios.swiftinterface`)
        );
      }
    }
  }
}

/** Recursively searches a directory for an xcframework with the given product name. */
export async function findXCFrameworkInDir(
  dir: string,
  productName: string
): Promise<string | null> {
  const target = `${productName}.xcframework`;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === target) return fullPath;
      const found = await findXCFrameworkInDir(fullPath, productName);
      if (found) return found;
    }
  }
  return null;
}

/** Returns the first path that exists, or null if none do. */
export async function findFirstExisting(paths: string[]): Promise<string | null> {
  for (const p of paths) {
    if (await fs.pathExists(p)) return p;
  }
  return null;
}

/**
 * Derives the SPM package name from a URL.
 * e.g., "https://github.com/airbnb/lottie-spm.git" → "lottie-spm"
 */
export function derivePackageName(url: string): string {
  const lastSlash = url.lastIndexOf('/');
  let name = url.substring(lastSlash + 1);
  if (name.endsWith('.git')) {
    name = name.slice(0, -4);
  }
  return name;
}

/**
 * Formats a version requirement for Package.swift.
 */
export function formatVersionRequirement(version: SPMPackageDependencyConfig['version']): string {
  if ('exact' in version) return `exact: "${version.exact}"`;
  if ('from' in version) return `from: "${version.from}"`;
  if ('branch' in version) return `branch: "${version.branch}"`;
  if ('revision' in version) return `revision: "${version.revision}"`;
  throw new Error(`Invalid SPM version: ${JSON.stringify(version)}`);
}

/**
 * Generates a minimal Package.swift to build a standalone SPM dependency as a dynamic library.
 */
function generateStandaloneSPMPackageSwift(dep: SPMPackageDependencyConfig): string {
  const packageName = dep.packageName || derivePackageName(dep.url);
  const versionReq = formatVersionRequirement(dep.version);

  return `// swift-tools-version: 5.9
// Auto-generated for standalone SPM dependency build

import PackageDescription

let package = Package(
    name: "${dep.productName}-standalone",

    platforms: [
        .iOS(.v16)
    ],

    products: [
        .library(
            name: "${dep.productName}-standalone",
            type: .dynamic,
            targets: ["${dep.productName}-standalone"]
        )
    ],

    dependencies: [
        .package(url: "${dep.url}", ${versionReq})
    ],

    targets: [
        .target(
            name: "${dep.productName}-standalone",
            dependencies: [
                .product(name: "${dep.productName}", package: "${packageName}")
            ],
            path: "Sources"
        )
    ]
)
`;
}

/**
 * Builds a standalone SPM dependency as an xcframework and stores it at the shared location.
 *
 * This is called on first encounter when building a product that depends on an SPM package.
 * The resulting xcframework is shared across all products that use the same dependency,
 * preventing duplicate symbols at runtime.
 *
 * If this dependency depends on other shared SPM deps, those are built first (recursively)
 * and provided as binary targets to avoid statically linking duplicate code.
 *
 * @param dep The SPM package dependency config
 * @param buildType Build flavor (Debug or Release)
 * @param allSharedDeps Map of all shared SPM deps (productName → config) for inter-dep detection
 * @param platforms Build platforms to target (defaults to iOS + iOS Simulator)
 */
export async function buildSharedSPMDependencyAsync(
  dep: SPMPackageDependencyConfig,
  buildType: BuildFlavor,
  allSharedDeps: Map<string, SPMPackageDependencyConfig> = new Map(),
  platforms: BuildPlatform[] = ['iOS', 'iOS Simulator']
): Promise<void> {
  const productName = dep.productName;

  // Check if already built
  if (Frameworks.hasSharedSPMDepFramework(productName, buildType)) {
    logger.info(`⏭️  Shared SPM dep ${chalk.cyan(productName)} already exists for ${buildType}`);
    return;
  }

  logger.info(
    `🔨 Building shared SPM dependency ${chalk.cyan(productName)} [${buildType.toLowerCase()}]...`
  );

  // Set up build directory under .spm-deps/<productName>/
  // SourcePackages are shared across all shared dep builds via -clonedSourcePackagesDirPath
  // so xcodebuild clones each transitive dependency only once. DerivedData is per-dep
  // to avoid "Multiple commands produce" conflicts between different dep builds.
  const spmDepsRoot = Frameworks.getSharedSPMDepsRoot();
  const buildDir = path.join(spmDepsRoot, productName, '_build');
  const derivedDataPath = path.join(buildDir, 'DerivedData');
  const sharedSourcePackages = path.join(spmDepsRoot, '_SourcePackages');
  await fs.mkdirp(sharedSourcePackages);
  const sourcesDir = path.join(buildDir, 'Sources');

  // Only re-resolve if the Package.swift has changed (avoids re-downloading deps).
  // The stub and Package.swift are deterministic, so we compare against the previous content.
  await fs.mkdirp(sourcesDir);

  const stubPath = path.join(sourcesDir, 'Stub.swift');
  const stubContent = `// Stub file for standalone SPM dependency build\nimport Foundation\n`;
  const packageSwiftContent = generateStandaloneSPMPackageSwift(dep);
  const packageSwiftPath = path.join(buildDir, 'Package.swift');

  const existingPackageSwift = (await fs.pathExists(packageSwiftPath))
    ? await fs.readFile(packageSwiftPath, 'utf-8')
    : null;
  const needsResolve = existingPackageSwift !== packageSwiftContent;

  await fs.writeFile(stubPath, stubContent, 'utf-8');
  await fs.writeFile(packageSwiftPath, packageSwiftContent, 'utf-8');

  if (needsResolve) {
    // Package.swift changed or first run — resolve from scratch
    await resolveSPMDependenciesAndPatch(buildDir);
  } else {
    logger.info(`   ⏭️  SPM dependencies already resolved (Package.swift unchanged)`);
  }

  // Build from the dependency's own checkout so we get a framework with the correct
  // module name. The wrapper approach produces `<name>-standalone.framework` which has
  // the wrong module name. Building the checkout directly uses the dependency's own
  // Package.swift and scheme, producing `<name>.framework`.
  //
  // We copy the checkout to a clean location outside .build/ because SPM gets confused
  // about the workspace root when the checkout is nested inside another SPM workspace.
  const checkoutsDir = path.join(buildDir, '.build', 'checkouts');
  const packageName = dep.packageName || derivePackageName(dep.url);
  const checkoutSource = path.join(checkoutsDir, packageName);

  if (!(await fs.pathExists(checkoutSource))) {
    throw new Error(
      `Checkout not found for ${productName} at ${checkoutSource}. ` +
        `Available: ${(await fs.readdir(checkoutsDir)).join(', ')}`
    );
  }

  // Check if this is a binary xcframework (pre-compiled, not built from source).
  // If the Package.swift contains a .binaryTarget for this product, the xcframework
  // is downloaded during resolution — just copy it to the shared location.
  const checkoutPkgSwift = await fs.readFile(path.join(checkoutSource, 'Package.swift'), 'utf-8');
  if (checkoutPkgSwift.includes('.binaryTarget(')) {
    // Look for the downloaded artifact in SPM's artifacts cache
    const artifactsDir = path.join(buildDir, '.build', 'artifacts');
    if (await fs.pathExists(artifactsDir)) {
      const xcframeworkPath = await findXCFrameworkInDir(artifactsDir, productName);
      if (xcframeworkPath) {
        const destPath = Frameworks.getSharedSPMDepFrameworkPath(productName, buildType);
        await fs.mkdirp(path.dirname(destPath));
        await fs.remove(destPath);
        execSync(`rsync -a "${xcframeworkPath}/" "${destPath}/"`, { stdio: 'pipe' });
        logger.info(
          `✅ Copied binary SPM dep ${chalk.cyan(productName)} → ${path.relative(process.cwd(), destPath)}`
        );
        // Keep buildDir for caching — resolved artifacts persist for reuse
        return;
      }
    }
    logger.warn(
      `⚠️  ${productName} has .binaryTarget but xcframework not found in artifacts, falling back to build`
    );
  }

  // Copy checkout to a clean location so xcodebuild can resolve its own dependencies.
  // We patch the copy to ensure xcodebuild produces a .framework bundle:
  //  - Remove .xcodeproj/.xcworkspace so xcodebuild uses Package.swift for SPM resolution
  //  - Force the library type to .dynamic (automatic defaults to static → no .framework)
  const cleanBuildDir = path.join(buildDir, '_pkg');
  await fs.remove(cleanBuildDir);
  execSync(`rsync -a "${checkoutSource}/" "${cleanBuildDir}/"`, { stdio: 'pipe' });
  // Make the copy writable (git checkouts may be read-only)
  execSync(`chmod -R u+w "${cleanBuildDir}"`, { stdio: 'pipe' });
  for (const entry of await fs.readdir(cleanBuildDir)) {
    if (entry.endsWith('.xcodeproj') || entry.endsWith('.xcworkspace')) {
      await fs.remove(path.join(cleanBuildDir, entry));
    }
  }
  // Patch Package.swift: change `.library(name: "...", targets:` to `.library(name: "...", type: .dynamic, targets:`
  // so that xcodebuild produces a .framework bundle instead of a static archive.
  const pkgSwift = path.join(cleanBuildDir, 'Package.swift');
  let pkgSwiftContent = await fs.readFile(pkgSwift, 'utf-8');
  pkgSwiftContent = pkgSwiftContent.replace(
    /\.library\(\s*name:\s*"([^"]+)",\s*targets:/g,
    '.library(name: "$1", type: .dynamic, targets:'
  );
  await fs.writeFile(pkgSwift, pkgSwiftContent, 'utf-8');

  // Detect inter-dependencies with other shared SPM deps.
  // If SDWebImageWebPCoder depends on SDWebImage (also a shared dep), we need to:
  // 1. Build SDWebImage first (recursively)
  // 2. Patch this checkout's Package.swift to use SDWebImage as a binary target
  // This prevents SDWebImage from being statically linked into SDWebImageWebPCoder,
  // which would cause duplicate symbols at runtime.
  if (allSharedDeps.size > 0) {
    const interDeps = getSharedInterDeps(pkgSwiftContent, allSharedDeps);
    // Filter out self-reference
    const externalInterDeps = interDeps.filter((d) => d !== productName);

    if (externalInterDeps.length > 0) {
      logger.info(
        `   🔗 ${productName} depends on shared deps: ${externalInterDeps.map((d) => chalk.cyan(d)).join(', ')}`
      );

      // Recursively build any inter-deps that haven't been built yet
      for (const interDepName of externalInterDeps) {
        const interDep = allSharedDeps.get(interDepName);
        if (interDep && !Frameworks.hasSharedSPMDepFramework(interDepName, buildType)) {
          logger.info(`   ↳ Building dependency ${chalk.cyan(interDepName)} first...`);
          await buildSharedSPMDependencyAsync(interDep, buildType, allSharedDeps, platforms);
        }
      }

      // Patch the checkout's Package.swift to use pre-built binary targets
      const builtDeps = new Map<string, string>();
      for (const interDepName of externalInterDeps) {
        const xcfwPath = Frameworks.getSharedSPMDepFrameworkPath(interDepName, buildType);
        if (await fs.pathExists(xcfwPath)) {
          builtDeps.set(interDepName, xcfwPath);
        }
      }
      if (builtDeps.size > 0) {
        await patchCheckoutWithSharedDeps(pkgSwift, builtDeps);
      }
    }
  }

  for (const platform of platforms) {
    const args = [
      '-scheme',
      productName,
      '-destination',
      `generic/platform=${platform}`,
      '-derivedDataPath',
      derivedDataPath,
      '-clonedSourcePackagesDirPath',
      sharedSourcePackages,
      '-configuration',
      buildType,
      'SKIP_INSTALL=NO',
      'BUILD_LIBRARY_FOR_DISTRIBUTION=YES',
      ...(buildType === 'Release'
        ? ['GCC_PREPROCESSOR_DEFINITIONS=$(inherited) NDEBUG=1 NS_BLOCK_ASSERTIONS=1']
        : ['GCC_PREPROCESSOR_DEFINITIONS=$(inherited) DEBUG=1']),
      'build',
    ];

    const { code, error: buildError } = await spawnXcodeBuildWithSpinner(
      args,
      cleanBuildDir,
      `Building ${chalk.cyan(productName)} for ${chalk.green(platform)}/${chalk.green(buildType.toLowerCase())}`
    );

    if (code !== 0) {
      throw new Error(
        `Failed to build shared SPM dep ${productName} for ${platform}:\n${buildError}\n\nxcodebuild ${args.join(' ')}`
      );
    }
  }

  // Collect built frameworks for xcframework creation
  const frameworkArgs: string[] = ['-create-xcframework'];

  for (const platform of platforms) {
    const buildFolderPrefix = getBuildFolderPrefixForPlatform(platform);
    const buildProductsDir = path.join(
      derivedDataPath,
      'Build',
      'Products',
      `${buildType}-${buildFolderPrefix}`
    );
    // Check PackageFrameworks/ first (where SPM places dependency frameworks),
    // then the top-level build products dir
    const candidatePaths = [
      path.join(buildProductsDir, 'PackageFrameworks', `${productName}.framework`),
      path.join(buildProductsDir, `${productName}.framework`),
    ];

    const frameworkPath = await findFirstExisting(candidatePaths);
    const dsymPath = await findFirstExisting(candidatePaths.map((p) => `${p}.dSYM`));

    if (frameworkPath) {
      // SPM's PackageFrameworks/ output doesn't include Headers/ or Modules/ —
      // they're in the build intermediates. We need to copy them into the framework
      // so the xcframework can be used as a build dependency with module imports.
      await enrichFrameworkWithHeaders(
        frameworkPath,
        productName,
        cleanBuildDir,
        derivedDataPath,
        buildFolderPrefix,
        buildType
      );
      frameworkArgs.push('-framework', frameworkPath);
      if (dsymPath) {
        frameworkArgs.push('-debug-symbols', dsymPath);
      }
    } else {
      // The dependency might be delivered as a binary xcframework (not built from source).
      // Check SourcePackages/artifacts for it.
      const artifactXCFrameworkPath = path.join(
        derivedDataPath,
        'SourcePackages',
        'artifacts',
        packageName,
        productName,
        `${productName}.xcframework`
      );

      if (await fs.pathExists(artifactXCFrameworkPath)) {
        // Binary xcframework from SPM — copy it directly to the shared location
        const destPath = Frameworks.getSharedSPMDepFrameworkPath(productName, buildType);
        await fs.mkdirp(path.dirname(destPath));
        await fs.remove(destPath);
        execSync(`rsync -a "${artifactXCFrameworkPath}/" "${destPath}/"`, { stdio: 'pipe' });
        logger.info(`✅ Copied binary SPM dep ${chalk.cyan(productName)} to shared location`);

        // Clean up build directory
        await fs.remove(buildDir);
        return;
      }

      logger.warn(
        `⚠️  Framework not found for ${productName} at platform ${platform}. Checked:\n` +
          candidatePaths.map((p) => `      ${p}`).join('\n')
      );
    }
  }

  // Create the xcframework
  const destPath = Frameworks.getSharedSPMDepFrameworkPath(productName, buildType);
  await fs.mkdirp(path.dirname(destPath));
  await fs.remove(destPath);
  frameworkArgs.push('-output', destPath);

  const { code, error: composeError } = await spawnXcodeBuildWithSpinner(
    frameworkArgs,
    buildDir,
    `Composing ${chalk.cyan(productName)}.xcframework`
  );

  if (code !== 0) {
    throw new Error(`Failed to compose xcframework for ${productName}:\n${composeError}`);
  }

  // Keep the build directory for caching — resolved checkouts persist so
  // subsequent rebuilds (after deleting the xcframework) skip re-downloading.
  // Only DerivedData is cleaned since it's large and not reusable across builds.
  await fs.remove(derivedDataPath);

  logger.info(
    `✅ Built shared SPM dep ${chalk.cyan(productName)} → ${path.relative(process.cwd(), destPath)}`
  );
}
