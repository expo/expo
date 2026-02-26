/**
 * SPMPackage - Generates a clean, flat Package.swift from SPM configuration.
 *
 * This module generates Package.swift files without helper classes, producing
 * native SPM declarations that are easier to read and understand.
 */

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import type { DownloadedDependencies } from './Artifacts.types';
import type { SPMPackageSource } from './ExternalPackage';
import { getExternalPackageByProductName } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import { BuildFlavor } from './Prebuilder.types';
import { getPrecompileDir } from '../Directories';
import {
  ObjcTarget,
  SwiftTarget,
  CppTarget,
  SPMProduct,
  CompilerFlags,
  CompilerFlagsVariant,
} from './SPMConfig.types';
import {
  ExternalDependencyConfig,
  PackageSwiftContext,
  ResolvedTarget,
  ResolvedSPMPackage,
  ResolvedTargetDependency,
  SPMPackageVersion,
} from './SPMPackage.types';
import { createAsyncSpinner, SpinnerError } from './Utils';

/**
 * Finds the Headers directory inside an xcframework by picking the first available slice.
 * Headers are architecture-independent, so any slice's Headers directory will work.
 * @param xcframeworkPath Absolute path to the .xcframework directory
 * @returns Absolute path to the Headers directory, or null if not found
 */
function findXCFrameworkHeadersDir(xcframeworkPath: string): string | null {
  if (!fs.existsSync(xcframeworkPath)) {
    return null;
  }
  const entries = fs.readdirSync(xcframeworkPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.' || entry.name === '..') {
      continue;
    }
    // Look for a slice directory (e.g., ios-arm64, ios-arm64_x86_64-simulator)
    const sliceDir = path.join(xcframeworkPath, entry.name);
    // Inside the slice, look for a .framework directory
    const sliceEntries = fs.readdirSync(sliceDir, { withFileTypes: true });
    for (const sliceEntry of sliceEntries) {
      if (sliceEntry.isDirectory() && sliceEntry.name.endsWith('.framework')) {
        const headersDir = path.join(sliceDir, sliceEntry.name, 'Headers');
        if (fs.existsSync(headersDir)) {
          return headersDir;
        }
      }
    }
  }
  return null;
}

/**
 * Escapes a string for use in a Swift string literal.
 * Handles backslashes and double quotes.
 */
function escapeSwiftString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Cache for the resolved React Native minor version.
 * Lazily resolved from node_modules/react-native/package.json.
 */
let _reactNativeMinorVersion: number | null = null;

/**
 * Gets the React Native minor version from node_modules.
 * Uses pkg.path to locate the workspace root's node_modules.
 */
function getReactNativeMinorVersion(pkgPath: string): number {
  if (_reactNativeMinorVersion !== null) {
    return _reactNativeMinorVersion;
  }
  // pkgPath is e.g. /workspace/node_modules/react-native-gesture-handler
  // Navigate to sibling react-native package
  const rnPackageJsonPath = path.resolve(pkgPath, '..', 'react-native', 'package.json');
  try {
    const rnPackageJson = fs.readJsonSync(rnPackageJsonPath);
    const version: string = rnPackageJson.version;
    const minor = parseInt(version.split('.')[1], 10);
    if (isNaN(minor)) {
      throw new Error(`Could not parse minor version from react-native version: ${version}`);
    }
    _reactNativeMinorVersion = minor;
    return minor;
  } catch (e: any) {
    throw new Error(
      `Failed to resolve REACT_NATIVE_MINOR_VERSION from ${rnPackageJsonPath}: ${e.message}`
    );
  }
}

const _packageVersionCache: Record<string, string> = {};

/**
 * Resolves the package version from the package.json in the given path.
 * @param pkgPath Path to the package (e.g., /workspace/packages/external/react-native-worklets)
 * @returns The version string from package.json
 * @throws if the version cannot be resolved
 */
function getPackageVersion(pkgPath: string): string {
  if (!_packageVersionCache[pkgPath]) {
    const pgkJsonPath = path.join(pkgPath, 'package.json');
    try {
      const pkgJson = fs.readJsonSync(pgkJsonPath);
      const version: string = pkgJson.version;
      _packageVersionCache[pkgPath] = version;
    } catch (e: any) {
      throw new Error(`Failed to resolve PACKAGE_VERSION from ${pgkJsonPath}: ${e.message}`);
    }
  }
  return _packageVersionCache[pkgPath];
}

/**
 * Mapping of variable names to their resolver functions for compiler flag substitution.
 */
const REPLACEMENTS = {
  REACT_NATIVE_MINOR_VERSION: getReactNativeMinorVersion,
  PACKAGE_VERSION: getPackageVersion,
};

/**
 * Substitutes known variables in compiler flag strings.
 * Supported variables in @see(REPLACEMENTS)
 */
function substituteCompilerFlagVariables(flags: string[], pkgPath: string): string[] {
  const hasVariable = flags.some((f) => f.includes('${'));
  if (!hasVariable) {
    return flags;
  }
  return flags.map((flag) => {
    // Find in REPLACEMENTS:
    const replacements = Object.keys(REPLACEMENTS);
    const matches = replacements.filter((key) => flag.includes(key));
    if (matches.length > 0) {
      const match = matches[0];
      const replacementFunc = REPLACEMENTS[match];
      if (replacementFunc) {
        const replacementValue = String(replacementFunc(pkgPath));
        return flag.replace(new RegExp(`\\$\\{${match}\\}`, 'g'), replacementValue);
      }
    }
    return flag; // Return original flag if no replacement function found
  });
}

/**
 * Formats a target dependency for Package.swift.
 * Strings become quoted ("Hermes"), while product references become .product(name:, package:)
 */
function formatTargetDependency(dep: ResolvedTargetDependency): string {
  if (typeof dep === 'string') {
    return `"${dep}"`;
  }
  return `.product(name: "${dep.product}", package: "${dep.package}")`;
}

/**
 * Formats an SPM package version requirement for Package.swift.
 */
function formatSPMVersionRequirement(version: SPMPackageVersion): string {
  if ('exact' in version) {
    return `exact: "${version.exact}"`;
  }
  if ('from' in version) {
    return `from: "${version.from}"`;
  }
  if ('branch' in version) {
    return `branch: "${version.branch}"`;
  }
  if ('revision' in version) {
    return `revision: "${version.revision}"`;
  }
  throw new Error(`Invalid SPM version specification: ${JSON.stringify(version)}`);
}

/**
 * Derives the package name from an SPM URL.
 * e.g., "https://github.com/airbnb/lottie-spm.git" -> "lottie-spm"
 */
function derivePackageNameFromUrl(url: string): string {
  const lastSlash = url.lastIndexOf('/');
  let name = url.substring(lastSlash + 1);
  if (name.endsWith('.git')) {
    name = name.slice(0, -4);
  }
  return name;
}

/**
 * Resolves compiler flags from the various shorthand formats to normalized { c: string[], cxx: string[] }
 *
 * Supports:
 * - Array shorthand: `["-DFOO=1"]` → common flags for both c and cxx
 * - Object with common/debug/release: `{ common: [...], debug: [...], release: [...] }`
 * - Each variant can be array (both c/cxx) or per-language: `{ c: [...], cxx: [...] }`
 */
function resolveCompilerFlags(
  flags: CompilerFlags,
  buildType: BuildFlavor
): { c: string[]; cxx: string[] } {
  const result = { c: [] as string[], cxx: [] as string[] };

  // Helper to add a variant's flags to the result
  const addVariant = (variant: CompilerFlagsVariant | undefined) => {
    if (!variant) return;
    if (Array.isArray(variant)) {
      // Array shorthand: apply to both c and cxx
      result.c.push(...variant);
      result.cxx.push(...variant);
    } else {
      // Object with c/cxx keys
      if (variant.c) result.c.push(...variant.c);
      if (variant.cxx) result.cxx.push(...variant.cxx);
    }
  };

  if (Array.isArray(flags)) {
    // Top-level array shorthand: treat as common flags for both c and cxx
    result.c.push(...flags);
    result.cxx.push(...flags);
  } else {
    // Object with common/debug/release keys
    addVariant(flags.common);
    if (buildType === 'Debug') {
      addVariant(flags.debug);
    } else {
      addVariant(flags.release);
    }
  }

  return result;
}

/** Quotes a compiler flag for Package.swift output. */
function quoteFlag(f: string): string {
  return `"${f}"`;
}

/**
 * Formats a list of compiler flags into grouped lines for readable Package.swift output.
 * Flags are grouped in pairs (flag + value, e.g. "-I" + "/path") with each pair on its own line.
 * When using -Xcc wrapping for Swift, each "-Xcc" + flag becomes one line.
 */
function formatFlagPairs(flags: string[]): string {
  const pairs: string[] = [];
  for (let i = 0; i < flags.length; i += 2) {
    if (i + 1 < flags.length) {
      pairs.push(`${quoteFlag(flags[i])}, ${quoteFlag(flags[i + 1])}`);
    } else {
      pairs.push(quoteFlag(flags[i]));
    }
  }
  if (pairs.length <= 1) {
    return `[${pairs.join(', ')}]`;
  }
  return `[\n${pairs.map((p) => `                    ${p}`).join(',\n')},\n                ]`;
}

/**
 * Pushes an `.unsafeFlags(...)` directive to one or more settings arrays.
 * Flags are formatted as pairs (e.g. ["-I", "/path"] → ["-I /path"]).
 * When configuration is specified, wraps with `.when(configuration: .debug/.release)`.
 */
function pushUnsafeFlags(
  targets: string[][],
  flags: string[],
  configuration?: 'debug' | 'release'
): void {
  if (flags.length === 0) return;
  const formatted = formatFlagPairs(flags);
  const directive = configuration
    ? `.unsafeFlags(${formatted}, .when(configuration: .${configuration}))`
    : `.unsafeFlags(${formatted})`;
  for (const target of targets) {
    target.push(directive);
  }
}

/** Artifact paths for dependency resolution (DownloadedDependencies minus the buildFlavor field) */
type ArtifactPaths = Omit<DownloadedDependencies, 'buildFlavor'>;

/**
 * Generates Package.swift content from SPM configuration.
 * This produces a flat Package.swift without helper classes.
 */
async function generatePackageSwiftAsync(
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  packageSwiftPath: string,
  targetSourceCodePath: string,
  artifactPaths?: ArtifactPaths
): Promise<string> {
  const context = await buildPackageSwiftContext(
    pkg,
    product,
    buildType,
    packageSwiftPath,
    targetSourceCodePath,
    artifactPaths
  );
  return generatePackageSwiftContent(context);
}

// Main Export: SPMPackage

export const SPMPackage = {
  /**
   * Writes a Package.swift file to a specified path.
   *
   * @param pkg The package to generate for
   * @param product The product to generate for
   * @param buildType Debug or Release build flavor
   * @param packageSwiftPath Path to write the Package.swift file
   * @param targetSourceCodePath Path to the target source code folder
   * @param artifactPaths Optional artifact paths from centralized cache
   */
  async writePackageSwiftAsync(
    pkg: SPMPackageSource,
    product: SPMProduct,
    buildType: BuildFlavor,
    packageSwiftPath: string,
    targetSourceCodePath: string,
    artifactPaths?: ArtifactPaths
  ): Promise<void> {
    const content = await generatePackageSwiftAsync(
      pkg,
      product,
      buildType,
      packageSwiftPath,
      targetSourceCodePath,
      artifactPaths
    );
    await fs.ensureDir(path.dirname(packageSwiftPath));

    // Only write if content changed (preserves mtime for Xcode incremental builds)
    if (await fs.pathExists(packageSwiftPath)) {
      const existing = await fs.readFile(packageSwiftPath, 'utf-8');
      if (existing === content) {
        return; // No changes
      }
    }
    await fs.writeFile(packageSwiftPath, content, 'utf-8');
  },
};

// External Dependency Configurations

/**
 * Artifact paths within the cache structure (relative to the versioned artifact folder).
 * These paths match the structure of downloaded/extracted Maven artifacts.
 * Keys are lowercase for consistent lookup.
 */
const ARTIFACT_RELATIVE_PATHS: Record<
  string,
  {
    xcframeworkPath: string;
    includeDirectories: string[];
    vfsOverlayFile?: string;
    /** Display name used in Package.swift */
    displayName: string;
    /** Key on ArtifactPaths for the flavor-specific base path */
    artifactKey: keyof ArtifactPaths;
    /** Cache directory name (under cachePath/) */
    cacheDirName: string;
    /** Which version field to use from ArtifactPaths */
    versionKey: 'hermesVersion' | 'reactNativeVersion';
  }
> = {
  hermes: {
    xcframeworkPath: 'destroot/Library/Frameworks/universal/hermesvm.xcframework',
    includeDirectories: ['../../../../include'],
    displayName: 'Hermes',
    artifactKey: 'hermes',
    cacheDirName: 'hermes',
    versionKey: 'hermesVersion',
  },
  react: {
    xcframeworkPath: 'React.xcframework',
    includeDirectories: ['Headers', 'React_Core'],
    vfsOverlayFile: 'React-VFS.yaml',
    displayName: 'React',
    artifactKey: 'react',
    cacheDirName: 'react',
    versionKey: 'reactNativeVersion',
  },
  reactnativedependencies: {
    xcframeworkPath: 'ReactNativeDependencies.xcframework',
    includeDirectories: ['Headers'],
    displayName: 'ReactNativeDependencies',
    artifactKey: 'reactNativeDependencies',
    cacheDirName: 'react-native-dependencies',
    versionKey: 'reactNativeVersion',
  },
};

/**
 * Computes the external dependency configuration with paths relative to packageSwiftDir.
 * This allows packages in any location (packages/ or node_modules/) to reference the centralized cache.
 * Binary target paths point to the currently-built flavor (buildType).
 * Include paths are provided for both debug and release so callers can emit
 * .when(configuration:) modifiers in Package.swift.
 *
 * @param dependencyName Name of the dependency (hermes, react, reactnativedependencies)
 * @param artifactPaths Downloaded artifact paths from Dependencies.downloadArtifactsAsync
 * @param packageSwiftDir Directory where Package.swift will be located
 * @param buildType Current build flavor (determines which xcframework path the binary target points to)
 * @returns Configuration with paths relative to packageSwiftDir, or undefined if not a known dependency
 */
function getExternalDependencyConfig(
  dependencyName: string,
  artifactPaths: ArtifactPaths | null,
  packageSwiftDir: string,
  buildType: BuildFlavor
): ExternalDependencyConfig | undefined {
  if (!artifactPaths) {
    return undefined;
  }

  const normalizedName = dependencyName.toLowerCase();
  const config = ARTIFACT_RELATIVE_PATHS[normalizedName];
  if (!config) {
    return undefined;
  }

  const flavorBasePath = artifactPaths[config.artifactKey] as string;
  const xcframeworkAbsPath = path.join(flavorBasePath, config.xcframeworkPath);
  const relativePath = path.relative(packageSwiftDir, xcframeworkAbsPath);
  const version = artifactPaths[config.versionKey] as string;

  return {
    name: config.displayName,
    path: relativePath,
    includeDirectories: config.includeDirectories,
    hasVfsOverlay: !!config.vfsOverlayFile,
    debugBasePath: path.join(artifactPaths.cachePath, config.cacheDirName, version, 'debug'),
    releaseBasePath: path.join(artifactPaths.cachePath, config.cacheDirName, version, 'release'),
  };
}

// Package.swift Generation

/**
 * Generates Package.swift content as a string
 */
function generatePackageSwiftContent(context: PackageSwiftContext): string {
  const lines: string[] = [];

  // Header
  lines.push('// swift-tools-version: 5.9');
  lines.push('// Copyright 2022-present 650 Industries. All rights reserved.');
  lines.push('');
  lines.push('import PackageDescription');
  lines.push('');

  // Package declaration
  lines.push('let package = Package(');
  lines.push(`    name: "${context.packageName}",`);
  lines.push('');

  // Platforms
  lines.push('    platforms: [');
  const platformLines = context.platforms.map((p) => `        .${p}`);
  lines.push(platformLines.join(',\n'));
  lines.push('    ],');
  lines.push('');

  // Products (must come before dependencies in SPM)
  lines.push('    products: [');

  const { product } = context;

  const targetsList = product.targets.map((t) => `"${t.name}"`).join(', ');
  lines.push(`        .library(`);
  lines.push(`            name: "${product.name}",`);
  lines.push(`            type: .dynamic,`);
  lines.push(`            targets: [${targetsList}]`);
  lines.push(`        )`);
  lines.push('    ],');
  lines.push('');

  // Remote SPM package dependencies (if any)
  if (context.spmPackages && context.spmPackages.length > 0) {
    lines.push('    dependencies: [');
    for (let i = 0; i < context.spmPackages.length; i++) {
      const pkg = context.spmPackages[i];
      const comma = i < context.spmPackages.length - 1 ? ',' : '';
      lines.push(`        .package(url: "${pkg.url}", ${pkg.versionRequirement})${comma}`);
    }
    lines.push('    ],');
    lines.push('');
  }

  // Targets
  lines.push('    targets: [');
  for (let i = 0; i < context.targets.length; i++) {
    const target = context.targets[i];
    const comma = i < context.targets.length - 1 ? ',' : '';
    lines.push(generateTargetDeclaration(target, comma));
  }
  lines.push('    ],');
  lines.push('');

  // Swift language versions (optional)
  if (context.swiftLanguageVersions && context.swiftLanguageVersions.length > 0) {
    const versions = context.swiftLanguageVersions.map((v) => `.version("${v}")`).join(', ');
    lines.push(`    swiftLanguageVersions: [${versions}],`);
  }

  // C++ language standard
  lines.push('    cxxLanguageStandard: .cxx20');
  lines.push(')');

  return lines.join('\n');
}

/**
 * Generates a single target declaration for Package.swift
 */
function generateTargetDeclaration(target: ResolvedTarget, comma: string): string {
  const lines: string[] = [];

  if (target.type === 'binary') {
    // Binary target (xcframework)
    lines.push(`        .binaryTarget(`);
    lines.push(`            name: "${target.name}",`);
    lines.push(`            path: "${target.path}"`);
    lines.push(`        )${comma}`);
  } else {
    // Source target (swift, objc, cpp)
    lines.push(`        .target(`);
    lines.push(`            name: "${target.name}",`);

    // Dependencies - can be strings (binary targets) or .product() references (SPM packages)
    if (target.dependencies.length > 0) {
      const deps = target.dependencies.map((d) => formatTargetDependency(d)).join(', ');
      lines.push(`            dependencies: [${deps}],`);
    } else {
      lines.push(`            dependencies: [],`);
    }

    // Path
    lines.push(`            path: "${target.path}",`);

    // Sources - exclude everything except the expected source files (must come before publicHeadersPath)
    lines.push(`            sources: nil,`);

    // Resources
    if (target.resources && target.resources.length > 0) {
      lines.push(`            resources: [`);
      for (const res of target.resources) {
        lines.push(`                .${res.rule}("${res.path}"),`);
      }
      lines.push(`            ],`);
    }

    // Public headers path for ObjC/C++ targets (required for module map generation)
    if ((target.type === 'objc' || target.type === 'cpp') && target.publicHeadersPath) {
      lines.push(`            publicHeadersPath: "${target.publicHeadersPath}",`);
    }

    // C settings for ObjC and C++ targets
    if (
      (target.type === 'objc' || target.type === 'cpp') &&
      target.cSettings &&
      target.cSettings.length > 0
    ) {
      lines.push(`            cSettings: [`);
      for (const setting of target.cSettings) {
        lines.push(`                ${setting},`);
      }
      lines.push(`            ],`);
    }

    // CXX settings for C++ and ObjC targets (ObjC targets with .mm files need these too)
    if (
      (target.type === 'cpp' || target.type === 'objc') &&
      target.cxxSettings &&
      target.cxxSettings.length > 0
    ) {
      lines.push(`            cxxSettings: [`);
      for (const setting of target.cxxSettings) {
        lines.push(`                ${setting},`);
      }
      lines.push(`            ],`);
    }

    // Swift settings
    if (target.type === 'swift' && target.swiftSettings && target.swiftSettings.length > 0) {
      lines.push(`            swiftSettings: [`);
      for (const setting of target.swiftSettings) {
        lines.push(`                ${setting},`);
      }
      lines.push(`            ],`);
    }

    // Linker settings for linked frameworks
    if (target.linkerSettings && target.linkerSettings.length > 0) {
      lines.push(`            linkerSettings: [`);
      for (const setting of target.linkerSettings) {
        lines.push(`                ${setting},`);
      }
      lines.push(`            ]`);
    }

    lines.push(`        )${comma}`);
  }

  return lines.join('\n');
}

// Target Resolution

/**
 * Resolves a source target from SPMConfig to a ResolvedTarget
 * @param target - The target configuration
 * @param pkg - The package
 * @param productName - The product name
 * @param externalDeps - External dependencies for this target
 * @param packageSwiftPath - Directory where Package.swift will be located
 * @param targetSourceCodePath - Path to the Package.swift file
 * @param buildType - Debug or Release build flavor
 * @param artifactPaths - Optional artifact paths from centralized cache
 * @param spmProductToPackage - Map of SPM product names to their package names
 */
async function resolveSourceTarget(
  target: ObjcTarget | SwiftTarget | CppTarget,
  pkg: SPMPackageSource,
  productName: string,
  externalDeps: string[],
  packageSwiftPath: string,
  targetSourceCodePath: string,
  buildType: BuildFlavor,
  artifactPaths?: ArtifactPaths,
  spmProductToPackage?: Map<string, string>,
  xcframeworkPaths?: Map<string, { buildPath: string; productName: string }>
): Promise<ResolvedTarget> {
  // Get directory of Package.swift and create the target
  const packageSwiftDir = path.dirname(packageSwiftPath);

  // Convert dependencies to ResolvedTargetDependency format
  // SPM package products become { product, package }, others stay as strings
  const resolvedDependencies: ResolvedTargetDependency[] = (target.dependencies || []).map(
    (dep) => {
      const spmPackageName = spmProductToPackage?.get(dep);
      if (spmPackageName) {
        // This dependency comes from an SPM package
        return { product: dep, package: spmPackageName };
      }
      // This is a binary target or local target dependency
      return dep;
    }
  );

  const resolved: ResolvedTarget = {
    type: target.type,
    name: target.name,
    path: path.relative(packageSwiftDir, path.join(packageSwiftDir, target.name)),
    dependencies: resolvedDependencies,
    linkedFrameworks: target.linkedFrameworks || [],
  };

  // Build settings based on target type
  if (target.type === 'swift') {
    resolved.swiftSettings = buildSwiftSettings(
      externalDeps,
      artifactPaths || null,
      packageSwiftDir,
      buildType,
      target
    );
  } else if (target.type === 'objc' || target.type === 'cpp') {
    const { cSettings, cxxSettings } = buildCSettings(
      target,
      externalDeps,
      artifactPaths || null,
      packageSwiftDir,
      productName,
      pkg.packageVersion,
      pkg.path,
      pkg.buildPath,
      buildType,
      xcframeworkPaths
    );
    resolved.cSettings = cSettings;
    // ObjC targets with .mm files need cxxSettings too — SPM compiles .m files
    // as ObjC++ when mixed with .mm, so cxxSettings must carry the same flags.
    resolved.cxxSettings = cxxSettings;
    // Set publicHeadersPath for ObjC/C++ targets (critical for module map generation)
    // SPM only supports a single publicHeadersPath, so we use 'include' as per old generator
    // If publicHeaders is explicitly set to false, skip this to prevent module creation
    if (target.publicHeaders !== false) {
      resolved.publicHeadersPath = 'include';
    }
  }

  // Linker settings for linked frameworks and libraries
  if (resolved.linkedFrameworks.length > 0) {
    resolved.linkerSettings = resolved.linkedFrameworks.map((fw) => `.linkedFramework("${fw}")`);
  }

  // Linker flags (unsafe flags)
  if (target.linkerFlags && target.linkerFlags.length > 0) {
    if (!resolved.linkerSettings) {
      resolved.linkerSettings = [];
    }
    const quotedFlags = target.linkerFlags.map((f) => `"${f}"`).join(', ');
    resolved.linkerSettings.push(`.unsafeFlags([${quotedFlags}])`);
  }

  // Resolve resources: expand globs against package root and remap paths
  // to the copied location in the generated target folder (resources/ subdirectory)
  if (target.resources && target.resources.length > 0) {
    const resolvedResources: { path: string; rule: 'process' | 'copy' }[] = [];
    for (const r of target.resources) {
      const matchedFiles = await glob(r.path, { cwd: pkg.path });
      if (matchedFiles.length === 0) {
        throw new Error(
          `Resource not found: "${r.path}" (resolved from package root: ${pkg.path}). ` +
            `No files matched this path or glob pattern.`
        );
      }
      for (const file of matchedFiles) {
        resolvedResources.push({
          path: `resources/${path.basename(file)}`,
          rule: r.rule || 'process',
        });
      }
    }
    resolved.resources = resolvedResources;
  }

  return resolved;
}

/**
 * Builds Swift compiler settings for a Swift target
 * @param externalDeps - External dependencies
 * @param artifactPaths - Paths to downloaded artifacts from centralized cache
 * @param packageSwiftDir - Directory where Package.swift will be located
 */
function buildSwiftSettings(
  externalDeps: string[],
  artifactPaths: ArtifactPaths | null,
  packageSwiftDir: string,
  buildType: BuildFlavor,
  target?: SwiftTarget
): string[] {
  const settings: string[] = [];

  // Enable Library Evolution for ABI stability
  settings.push('.enableUpcomingFeature("LibraryEvolution")');

  // Define RCT_NEW_ARCH_ENABLED for Fabric support
  settings.push('.define("RCT_NEW_ARCH_ENABLED")');

  // Common C++ flags (not path-dependent)
  // Note: -fcxx-modules is intentionally omitted (see buildCSettings comment).
  const commonCxxFlags: string[] = ['-Xcc', '-fmodules'];

  // Add VFS overlays and header maps per configuration
  // For Swift, each flag needs to be wrapped with -Xcc to pass it to the underlying Clang compiler
  const { debug, release } = collectVfsAndHeaderMapFlags(
    externalDeps,
    artifactPaths,
    packageSwiftDir,
    buildType
  );

  // Always emit common flags (modules)
  pushUnsafeFlags([settings], commonCxxFlags);

  // Debug/release-specific include paths (wrapped with -Xcc for Swift→Clang)
  pushUnsafeFlags(
    [settings],
    debug.flatMap((f) => ['-Xcc', f]),
    'debug'
  );
  pushUnsafeFlags(
    [settings],
    release.flatMap((f) => ['-Xcc', f]),
    'release'
  );

  // Process compilerFlags for Swift targets. These are passed as -Xcc flags
  // to Clang when the Swift compiler processes C module imports.
  // This is necessary for C targets with #ifdef-guarded APIs (e.g., SQLITE_ENABLE_SESSION)
  // where the defines must be visible during Swift's module import, not just C compilation.
  if (target?.compilerFlags) {
    const resolvedFlags = resolveCompilerFlags(target.compilerFlags, buildType);
    const xccFlags: string[] = [];
    for (const flag of resolvedFlags.c) {
      xccFlags.push('-Xcc', flag);
    }
    if (xccFlags.length > 0) {
      pushUnsafeFlags([settings], xccFlags);
    }
  }

  return settings;
}

/**
 * Builds C/C++ compiler settings for ObjC and C++ targets
 * @param target - The target configuration
 * @param externalDeps - External dependencies
 * @param artifactPaths - Paths to downloaded artifacts from centralized cache
 * @param packageSwiftDir - Directory where Package.swift will be located
 * @param productName - Product name for header search paths
 * @param packageVersion - Package version for defines
 * @param pkgPath - Path to the package source
 * @param buildType - Debug or Release build flavor
 * @param xcframeworkPaths - Map of dependency name to absolute xcframework path (for auto-resolving headers)
 */
function buildCSettings(
  target: ObjcTarget | CppTarget,
  externalDeps: string[],
  artifactPaths: ArtifactPaths | null,
  packageSwiftDir: string,
  productName: string,
  packageVersion: string,
  pkgPath: string,
  buildPath: string,
  buildType: BuildFlavor,
  xcframeworkPaths?: Map<string, { buildPath: string; productName: string }>
): {
  cSettings: string[];
  cxxSettings: string[];
} {
  const cSettings: string[] = [];
  const cxxSettings: string[] = [];

  // SPMGenerator copies headers to include/ subdirectory regardless of config
  // Add header search path for the include directory
  cSettings.push(`.headerSearchPath("include")`);
  cxxSettings.push(`.headerSearchPath("include")`);

  // Add product-specific subdirectory under include path
  // This matches the template behavior (lines 570-581) and allows files like SharedRef.cpp
  // to find their own headers like SharedRef.h via quoted includes
  // The subdirectory name matches the product name (e.g., include/ExpoModulesCore/)
  const productSubdir = `include/${productName}`;
  cSettings.push(`.headerSearchPath("${productSubdir}")`);
  cxxSettings.push(`.headerSearchPath("${productSubdir}")`);

  // If target has a custom moduleName different from the product name, also add that path
  // This allows targets to be included via their module name (e.g., #import <ExpoModulesJSI/Header.h>)
  if (target.moduleName && target.moduleName !== productName) {
    const moduleSubdir = `include/${target.moduleName}`;
    cSettings.push(`.headerSearchPath("${moduleSubdir}")`);
    cxxSettings.push(`.headerSearchPath("${moduleSubdir}")`);
  }

  // Add header search paths for file mappings (for local includes from mapped header locations)
  // This allows source files to use #include "Header.h" for headers that were mapped to custom paths
  if (target.fileMapping && target.fileMapping.length > 0) {
    const mappedPaths = new Set<string>();
    for (const mapping of target.fileMapping) {
      if (mapping.type === 'header') {
        // Extract the directory portion of the mapping destination
        // e.g., "react/renderer/components/rnscreens/{filename}" -> "include/react/renderer/components/rnscreens"
        const destDir = path.dirname(mapping.to);
        if (destDir && destDir !== '.') {
          mappedPaths.add(`include/${destDir}`);
        }
      }
    }
    for (const mappedPath of mappedPaths) {
      cSettings.push(`.headerSearchPath("${mappedPath}")`);
      cxxSettings.push(`.headerSearchPath("${mappedPath}")`);
    }
  }

  // Define RCT_NEW_ARCH_ENABLED (matches template line 763-765)
  // Must define with value "1" for C/C++/ObjC targets
  cSettings.push('.define("RCT_NEW_ARCH_ENABLED", to: "1")');
  cxxSettings.push('.define("RCT_NEW_ARCH_ENABLED", to: "1")');

  // Enable Clang modules for ObjC/React module maps (VFS overlays).
  // Note: -fcxx-modules is intentionally omitted — it enforces strict C++ standard library
  // module imports (e.g. "must import 'std.optional'"), which breaks third-party code that
  // relies on transitive includes. Only -fmodules is needed for React's VFS module maps.
  cSettings.push('.unsafeFlags(["-fmodules"])');
  cxxSettings.push('.unsafeFlags(["-fmodules"])');

  // Do NOT add `-x objective-c++` — it causes C++ name mangling on plain C functions,
  // breaking symbol resolution from Swift. SPM handles .mm → ObjC++ natively.

  // Add target-specific include directories (relative to target path in the package root)
  // These are used for targets that need to include headers from other locations (e.g., codegen)
  // The includeDirectories in the config are relative to the target's original path (target.path),
  // which is relative to pkg.path. So we resolve: pkg.path + target.path + includeDir
  if (target.includeDirectories && target.includeDirectories.length > 0) {
    const includeFlags: string[] = [];
    for (const includeDir of target.includeDirectories) {
      // Resolve relative to the original target path.
      // .build/ prefix in spm.config.json indicates a build artifact path (e.g., codegen output).
      // Since buildPath already includes .build/ in its path, strip the prefix before joining.
      const isBuildArtifact = target.path.startsWith('.build/');
      const targetRoot = isBuildArtifact ? buildPath : pkgPath;
      const resolvedTargetPath = isBuildArtifact
        ? target.path.slice('.build/'.length)
        : target.path;
      let includePath = path.resolve(targetRoot, resolvedTargetPath, includeDir);

      // If the resolved path lands inside pkgPath/.build/, remap it to buildPath/
      // This handles cases like target.path="common/cpp" with includeDir="../../.build/codegen/..."
      // where the relative traversal leads into .build/ which now lives under buildPath.
      // Since buildPath already contains .build/ in its own path, we strip pkgPath/.build/
      // and prepend buildPath/ directly.
      const pkgBuildPrefix = path.join(pkgPath, '.build') + path.sep;
      if (includePath === path.join(pkgPath, '.build')) {
        includePath = buildPath;
      } else if (includePath.startsWith(pkgBuildPrefix)) {
        includePath = path.join(buildPath, includePath.slice(pkgBuildPrefix.length));
      }

      // Use absolute path — SPM passes .unsafeFlags -I values directly to the compiler,
      // which resolves them relative to its own CWD (inside DerivedData), not the Package.swift dir.
      includeFlags.push('-I', includePath);
    }
    pushUnsafeFlags([cSettings, cxxSettings], includeFlags);
  }

  // Auto-resolve header include paths for xcframework binary dependencies.
  // When a C/C++ target depends on an xcframework (e.g., RNWorklets), the compiler
  // needs -I flags pointing to the framework's Headers directory so that
  // #include <worklets/...> can find the headers. SPM binary targets don't automatically
  // expose C/C++ headers to dependents.
  //
  // Uses .when(configuration:) so a single Package.swift works for both debug and release
  // without regeneration — each configuration resolves its own xcframework headers.
  if (xcframeworkPaths && target.dependencies) {
    const debugIncludeFlags: string[] = [];
    const releaseIncludeFlags: string[] = [];
    for (const dep of target.dependencies) {
      const depInfo = xcframeworkPaths.get(dep);
      if (depInfo) {
        const debugXcfwPath = Frameworks.getFrameworkPath(
          depInfo.buildPath,
          depInfo.productName,
          'Debug'
        );
        const releaseXcfwPath = Frameworks.getFrameworkPath(
          depInfo.buildPath,
          depInfo.productName,
          'Release'
        );
        const debugHeaders = findXCFrameworkHeadersDir(debugXcfwPath);
        const releaseHeaders = findXCFrameworkHeadersDir(releaseXcfwPath);
        if (debugHeaders) {
          debugIncludeFlags.push('-I', debugHeaders);
        }
        if (releaseHeaders) {
          releaseIncludeFlags.push('-I', releaseHeaders);
        }
      }
    }
    pushUnsafeFlags([cSettings, cxxSettings], debugIncludeFlags, 'debug');
    pushUnsafeFlags([cSettings, cxxSettings], releaseIncludeFlags, 'release');
  }

  // Add custom compiler flags from config
  // Supports multiple formats:
  // - Array shorthand: ["-DFOO=1"] → common flags for both c and cxx
  // - Object with common/debug/release: { common: [...], debug: [...], release: [...] }
  // - Each variant can be array or { c: [...], cxx: [...] }
  if (target.compilerFlags) {
    const resolvedFlags = resolveCompilerFlags(target.compilerFlags, buildType);
    // Substitute variables like ${REACT_NATIVE_MINOR_VERSION} in compiler flags
    const cFlags = substituteCompilerFlagVariables(resolvedFlags.c, pkgPath);
    const cxxFlags = substituteCompilerFlagVariables(resolvedFlags.cxx, pkgPath);

    // Separate -D flags into .define() settings and keep the rest as .unsafeFlags().
    // .define() is propagated by SPM to dependent targets when they import this module,
    // while .unsafeFlags() only applies during source compilation. This is critical for
    // headers with #ifdef guards (e.g., SQLITE_ENABLE_SESSION) — without .define(),
    // Swift targets importing this C module won't see the conditionally-compiled symbols.
    const addDefinesAndFlags = (flags: string[], settings: string[]) => {
      const otherFlags: string[] = [];
      for (const flag of flags) {
        const defineMatch = flag.match(/^-D(\w+)(?:=(.+))?$/);
        if (defineMatch) {
          const name = defineMatch[1];
          const value = defineMatch[2];
          if (value !== undefined) {
            settings.push(
              `.define("${escapeSwiftString(name)}", to: "${escapeSwiftString(value)}")`
            );
          } else {
            settings.push(`.define("${escapeSwiftString(name)}")`);
          }
        } else {
          otherFlags.push(flag);
        }
      }
      if (otherFlags.length > 0) {
        const flagString = `[${otherFlags.map((f) => `"${escapeSwiftString(f)}"`).join(', ')}]`;
        settings.push(`.unsafeFlags(${flagString})`);
      }
    };

    addDefinesAndFlags(cFlags, cSettings);
    addDefinesAndFlags(cxxFlags, cxxSettings);
  }

  // Add VFS overlays and header maps for React if present
  // Returns separate flag sets for debug and release configurations
  const { debug: vfsDebug, release: vfsRelease } = collectVfsAndHeaderMapFlags(
    externalDeps,
    artifactPaths,
    packageSwiftDir,
    buildType
  );

  // Debug/release-specific VFS overlay and header map flags
  pushUnsafeFlags([cSettings, cxxSettings], vfsDebug, 'debug');
  pushUnsafeFlags([cSettings, cxxSettings], vfsRelease, 'release');

  return { cSettings, cxxSettings };
}

/**
 * Extracts the root path from a VFS overlay YAML file.
 * The VFS overlay YAML has a structure like:
 * ```
 * version: 0
 * case-sensitive: false
 * roots:
 *   - name: '/path/to/root'
 * ```
 * This function parses the YAML and returns the first root's name path.
 */
function extractVFSOverlayRootPath(vfsOverlayPath: string): string | null {
  try {
    const yamlContent = fs.readFileSync(vfsOverlayPath, 'utf-8');
    const lines = yamlContent.split('\n');
    let inRoots = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'roots:') {
        inRoots = true;
        continue;
      }

      if (inRoots && trimmed.startsWith('- name:')) {
        // Extract the path from "- name: '/path/to/root'" or "- name: '/path/to/root'"
        const nameValue = trimmed.substring('- name:'.length).trim();
        // Remove quotes if present
        const cleanPath = nameValue.replace(/^['"]|['"]$/g, '');
        return cleanPath;
      }
    }
  } catch (error) {
    console.warn(`[WARNING] Could not read VFS overlay file: ${vfsOverlayPath}`, error);
  }

  return null;
}

/**
 * Collects VFS overlay, header map, and include directory flags for external dependencies.
 * Returns separate flag sets for debug and release configurations.
 * All paths use .when(configuration:) so a single Package.swift works for both flavors.
 * @param externalDeps - External dependency names
 * @param artifactPaths - Paths to downloaded artifacts from centralized cache
 * @param packageSwiftDir - Directory where Package.swift is located (for computing relative paths)
 * @param buildType - Current build flavor (for reading VFS overlay from the built flavor)
 */
function collectVfsAndHeaderMapFlags(
  externalDeps: string[],
  artifactPaths: ArtifactPaths | null,
  packageSwiftDir: string,
  buildType: BuildFlavor
): { debug: string[]; release: string[] } {
  const debug: string[] = [];
  const release: string[] = [];

  if (!artifactPaths) {
    return { debug, release };
  }

  for (const depName of externalDeps) {
    const config = getExternalDependencyConfig(
      depName.toLowerCase(),
      artifactPaths,
      packageSwiftDir,
      buildType
    );
    if (config) {
      // Add VFS overlay per configuration — each flavor has its own VFS YAML
      // with absolute paths pointing to its specific artifact directory.
      // Paths are emitted as absolute strings since Package.swift is a generated file.
      if (config.hasVfsOverlay) {
        const artifactConfig = ARTIFACT_RELATIVE_PATHS[depName.toLowerCase()];
        const vfsFile = artifactConfig?.vfsOverlayFile;
        if (vfsFile) {
          // Debug VFS overlay
          if (config.debugBasePath) {
            const debugVfsAbsPath = path.join(config.debugBasePath, vfsFile);
            if (fs.existsSync(debugVfsAbsPath)) {
              debug.push('-ivfsoverlay', debugVfsAbsPath);

              const vfsRootPath = extractVFSOverlayRootPath(debugVfsAbsPath);
              if (vfsRootPath) {
                debug.push('-I', vfsRootPath);
              }
            }
          }

          // Release VFS overlay
          if (config.releaseBasePath) {
            const releaseVfsAbsPath = path.join(config.releaseBasePath, vfsFile);
            if (fs.existsSync(releaseVfsAbsPath)) {
              release.push('-ivfsoverlay', releaseVfsAbsPath);

              const vfsRootPath = extractVFSOverlayRootPath(releaseVfsAbsPath);
              if (vfsRootPath) {
                release.push('-I', vfsRootPath);
              }
            }
          }
        }
      }

      // Add include directories per configuration (debug/release) as absolute paths.
      // Hermes is excluded here because its destroot/include/ contains jsi/ headers
      // that conflict with the identical jsi/ headers provided by the React VFS overlay.
      // Hermes include paths are instead passed via xcodebuild OTHER_CFLAGS, which
      // makes them available to the compiler but invisible to the Clang dependency scanner.
      if (config.includeDirectories && depName.toLowerCase() !== 'hermes') {
        const artifactConfig = ARTIFACT_RELATIVE_PATHS[depName.toLowerCase()];
        const xcframeworkRelPath = artifactConfig?.xcframeworkPath || '';

        if (config.debugBasePath) {
          const debugXcfwPath = path.join(config.debugBasePath, xcframeworkRelPath);
          for (const includeDir of config.includeDirectories) {
            const absIncludePath = path.resolve(debugXcfwPath, includeDir);
            debug.push('-I', absIncludePath);
          }
        }

        if (config.releaseBasePath) {
          const releaseXcfwPath = path.join(config.releaseBasePath, xcframeworkRelPath);
          for (const includeDir of config.includeDirectories) {
            const absIncludePath = path.resolve(releaseXcfwPath, includeDir);
            release.push('-I', absIncludePath);
          }
        }
      }
    }
  }

  return { debug, release };
}

// Context Building

/**
 * Builds the complete context needed for Package.swift generation
 */
async function buildPackageSwiftContext(
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildType: BuildFlavor,
  packageSwiftPath: string,
  targetSourceCodePath: string,
  artifactPaths?: ArtifactPaths
): Promise<PackageSwiftContext> {
  let spinner = createAsyncSpinner(`Build Package Swift context`, pkg, product);

  // Get root directory for the Package.swift file
  const packageSwiftDir = path.dirname(packageSwiftPath);

  // Collect all resolved targets
  const resolvedTargets: ResolvedTarget[] = [];
  const addedTargets = new Set<string>();

  // Map of dependency name -> build info for xcframework binary deps.
  // Used to auto-resolve header include paths with .when(configuration:) modifiers
  // so a single Package.swift works for both debug and release builds.
  // Only includes flavor-dependent deps (expo/external packages), not RN ecosystem deps
  // whose headers are already handled by collectVfsAndHeaderMapFlags.
  const xcframeworkPaths = new Map<string, { buildPath: string; productName: string }>();

  // Add external dependencies as binary targets
  const externalDeps = product.externalDependencies || [];
  for (const depName of externalDeps) {
    spinner.info(`Resolving external dependency: ${depName}`);

    // Check if it's a known React Native ecosystem dependency
    const externalConfig = getExternalDependencyConfig(
      depName,
      artifactPaths || null,
      packageSwiftDir,
      buildType
    );
    if (externalConfig) {
      // Path is already relative to packageSwiftDir
      resolvedTargets.push({
        type: 'binary',
        name: externalConfig.name,
        path: externalConfig.path,
        dependencies: [],
        linkedFrameworks: [],
      });
      // RN ecosystem deps (Hermes, React, etc.) don't need xcframeworkPaths tracking —
      // their headers are already resolved via collectVfsAndHeaderMapFlags.
      continue;
    }

    // Check if it's an expo package dependency (format: package/product or @scope/package/product)
    if (depName.includes('/')) {
      const parts = depName.split('/');
      // Scoped packages start with @ (e.g., @expo/ui/ExpoUI → package=@expo/ui, product=ExpoUI)
      const isScoped = parts[0].startsWith('@');
      const packageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
      const productName = isScoped ? parts[2] : parts[1];

      // XCFrameworks are in the centralized build directory
      const depBuildPath = path.join(getPrecompileDir(), '.build', packageName);
      const xcframeworkPath = Frameworks.getFrameworkPath(depBuildPath, productName, buildType);

      if (await fs.pathExists(xcframeworkPath)) {
        const frameworkRelativePath = path.relative(packageSwiftDir, xcframeworkPath);
        resolvedTargets.push({
          type: 'binary',
          name: depName,
          path: frameworkRelativePath,
          dependencies: [],
          linkedFrameworks: [],
        });
        xcframeworkPaths.set(depName, { buildPath: depBuildPath, productName });
        continue;
      } else {
        throw new SpinnerError(
          `Could not find xcframework for external dependency ${depName} at expected path: ${xcframeworkPath}`,
          spinner
        );
      }
    }

    // Check if it's an external package dependency (e.g., RNWorklets from react-native-worklets)
    // This handles dependencies between external packages in node_modules
    const externalPkg = getExternalPackageByProductName(depName);
    if (externalPkg) {
      const xcframeworkPath = Frameworks.getFrameworkPath(
        externalPkg.buildPath,
        depName,
        buildType
      );

      if (await fs.pathExists(xcframeworkPath)) {
        spinner.info(
          `Found external package ${externalPkg.packageName} providing ${depName} at ${xcframeworkPath}`
        );
        const frameworkRelativePath = path.relative(packageSwiftDir, xcframeworkPath);
        resolvedTargets.push({
          type: 'binary',
          name: depName,
          path: frameworkRelativePath,
          dependencies: [],
          linkedFrameworks: [],
        });
        xcframeworkPaths.set(depName, { buildPath: externalPkg.buildPath, productName: depName });
        continue;
      } else {
        throw new SpinnerError(
          `External package ${externalPkg.packageName} provides ${depName} but xcframework not found at: ${xcframeworkPath}. ` +
            `Please build ${externalPkg.packageName} first.`,
          spinner
        );
      }
    }
  }

  spinner.succeed('Resolved external dependencies');

  // Resolve SPM package dependencies (remote packages fetched by SPM)
  const resolvedSPMPackages: ResolvedSPMPackage[] = [];
  const spmProductToPackage = new Map<string, string>(); // Maps product name -> package name

  if (product.spmPackages && product.spmPackages.length > 0) {
    spinner = createAsyncSpinner(`Resolving SPM packages`, pkg, product);
    for (const spmPkg of product.spmPackages) {
      const packageName = spmPkg.packageName || derivePackageNameFromUrl(spmPkg.url);
      const versionRequirement = formatSPMVersionRequirement(spmPkg.version);

      spinner.info(`Adding SPM package: ${packageName} (${spmPkg.productName})`);

      resolvedSPMPackages.push({
        url: spmPkg.url,
        packageName,
        productName: spmPkg.productName,
        versionRequirement,
      });

      // Track the mapping so we can convert target dependencies later
      spmProductToPackage.set(spmPkg.productName, packageName);
    }
    spinner.succeed('Resolved SPM packages');
  }

  // Process framework targets first (vendored xcframeworks within the package)
  // These are binary targets that other source targets can depend on
  for (const target of product.targets) {
    if (target.type === 'framework') {
      const frameworkPath = path.join(pkg.path, target.path);
      const relativePath = path.relative(packageSwiftDir, frameworkPath);
      spinner.info(`Adding vendored framework target: ${target.name} at ${relativePath}`);
      resolvedTargets.push({
        type: 'binary',
        name: target.name,
        path: relativePath,
        dependencies: [],
        linkedFrameworks: target.linkedFrameworks || [],
      });
      addedTargets.add(target.name);
    }
  }

  // Process each product's targets
  spinner = createAsyncSpinner(`Resolving product targets`, pkg, product);
  for (const target of product.targets) {
    if (addedTargets.has(target.name)) {
      continue;
    }

    // Skip framework targets - already processed above
    if (target.type === 'framework') {
      continue;
    }

    spinner.info(`Resolving target: ${target.name}`);

    const resolved = await resolveSourceTarget(
      target,
      pkg,
      product.name,
      target.dependencies || [],
      packageSwiftPath,
      targetSourceCodePath,
      buildType,
      artifactPaths,
      spmProductToPackage,
      xcframeworkPaths
    );
    resolvedTargets.push(resolved);
    addedTargets.add(target.name);
  }

  spinner.succeed(`Resolved targets`);

  return {
    packageName: pkg.packageName,
    packageVersion: pkg.packageVersion,
    packageRootPath: pkg.path,
    platforms: product.platforms,
    swiftLanguageVersions: product.swiftLanguageVersions,
    product,
    targets: resolvedTargets,
    spmPackages: resolvedSPMPackages.length > 0 ? resolvedSPMPackages : undefined,
    artifactPaths,
  };
}
