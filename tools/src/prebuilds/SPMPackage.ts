/**
 * SPMPackage - Generates a clean, flat Package.swift from SPM configuration.
 *
 * This module generates Package.swift files without helper classes, producing
 * native SPM declarations that are easier to read and understand.
 */

import fs from 'fs-extra';
import path from 'path';

import { Package } from '../Packages';
import { Frameworks } from './Frameworks';
import { BuildFlavor } from './Prebuilder.types';
import {
  SPMConfig,
  SPMTarget,
  ObjcTarget,
  SwiftTarget,
  CppTarget,
  getTopLevelTargetNames,
} from './SPMConfig.types';
import { ExternalDependencyConfig, PackageSwiftContext, ResolvedTarget } from './SPMPackage.types';

// ============================================================================
// External Dependency Configurations
// ============================================================================

/**
 * Returns the configuration for known external dependencies (Hermes, React, ReactNativeDependencies)
 */
function getExternalDependencyConfig(dependencyName: string): ExternalDependencyConfig | undefined {
  const configs: Record<string, ExternalDependencyConfig> = {
    hermes: {
      name: 'Hermes',
      path: '.dependencies/Hermes/destroot/Library/Frameworks/universal/hermesvm.xcframework',
      includeDirectories: ['../../../../include'],
    },
    react: {
      name: 'React',
      path: '.dependencies/React-Core-prebuilt/React.xcframework',
      includeDirectories: ['Headers', 'React_Core'],
      headerMapPath: '.dependencies/React-Core-prebuilt/React-Headers.hmap',
      vfsOverlayPath: '.dependencies/React-Core-prebuilt/React-VFS.yaml',
    },
    reactnativedependencies: {
      name: 'ReactNativeDependencies',
      path: '.dependencies/ReactNativeDependencies/ReactNativeDependencies.xcframework',
      includeDirectories: ['Headers'],
    },
  };

  return configs[dependencyName.toLowerCase()];
}

// ============================================================================
// Package.swift Generation
// ============================================================================

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

  // Products
  lines.push('    products: [');
  for (let i = 0; i < context.products.length; i++) {
    const product = context.products[i];
    const targetsList = product.targets.map((t) => `"${t}"`).join(', ');
    const comma = i < context.products.length - 1 ? ',' : '';
    lines.push(`        .library(`);
    lines.push(`            name: "${product.name}",`);
    lines.push(`            type: .dynamic,`);
    lines.push(`            targets: [${targetsList}]`);
    lines.push(`        )${comma}`);
  }
  lines.push('    ],');
  lines.push('');

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

    // Dependencies
    if (target.dependencies.length > 0) {
      const deps = target.dependencies.map((d) => `"${d}"`).join(', ');
      lines.push(`            dependencies: [${deps}],`);
    } else {
      lines.push(`            dependencies: [],`);
    }

    // Path
    lines.push(`            path: "${target.path}",`);

    // Sources - exclude everything except the expected source files
    lines.push(`            sources: nil,`);

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

    // CXX settings for C++ targets
    if (target.type === 'cpp' && target.cxxSettings && target.cxxSettings.length > 0) {
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

// ============================================================================
// Target Resolution
// ============================================================================

/**
 * Resolves a source target from SPMConfig to a ResolvedTarget
 */
function resolveSourceTarget(
  target: ObjcTarget | SwiftTarget | CppTarget,
  pkg: Package,
  productName: string,
  externalDeps: string[]
): ResolvedTarget {
  const targetPath = path.join('.build/source', pkg.packageName, productName, target.name);

  const resolved: ResolvedTarget = {
    type: target.type,
    name: target.name,
    path: targetPath,
    dependencies: target.dependencies || [],
    linkedFrameworks: target.linkedFrameworks || [],
  };

  // Build settings based on target type
  if (target.type === 'swift') {
    resolved.swiftSettings = buildSwiftSettings(target, externalDeps, pkg.path);
  } else if (target.type === 'objc' || target.type === 'cpp') {
    const { cSettings, cxxSettings } = buildCSettings(
      target,
      externalDeps,
      pkg.path,
      productName,
      pkg.packageVersion
    );
    resolved.cSettings = cSettings;
    if (target.type === 'cpp') {
      resolved.cxxSettings = cxxSettings;
    }
  }

  // Linker settings for linked frameworks
  if (resolved.linkedFrameworks.length > 0) {
    resolved.linkerSettings = resolved.linkedFrameworks.map((fw) => `.linkedFramework("${fw}")`);
  }

  return resolved;
}

/**
 * Resolves a binary framework target
 */
function resolveBinaryTarget(name: string, frameworkPath: string): ResolvedTarget {
  return {
    type: 'binary',
    name,
    path: frameworkPath,
    dependencies: [],
    linkedFrameworks: [],
  };
}

/**
 * Builds Swift compiler settings for a Swift target
 */
function buildSwiftSettings(
  _target: SwiftTarget,
  externalDeps: string[],
  packageRootPath: string
): string[] {
  const settings: string[] = [];

  // Enable Library Evolution for ABI stability
  settings.push('.enableUpcomingFeature("LibraryEvolution")');

  // Define RCT_NEW_ARCH_ENABLED for Fabric support
  settings.push('.define("RCT_NEW_ARCH_ENABLED")');

  // Enable C++ and Clang modules
  const cxxFlags: string[] = ['-Xcc', '-fcxx-modules', '-Xcc', '-fmodules'];

  // Add VFS overlays and header maps for React if present
  // For Swift, each flag needs to be wrapped with -Xcc to pass it to the underlying Clang compiler
  const vfsFlags = collectVfsAndHeaderMapFlags(externalDeps, packageRootPath);
  for (const flag of vfsFlags) {
    cxxFlags.push('-Xcc', flag);
  }

  settings.push(
    `.unsafeFlags([${cxxFlags.map((f) => `"${f}"`).join(', ')}], .when(platforms: [.iOS, .macOS, .tvOS, .macCatalyst]))`
  );

  return settings;
}

/**
 * Builds C/C++ compiler settings for ObjC and C++ targets
 */
function buildCSettings(
  target: ObjcTarget | CppTarget,
  externalDeps: string[],
  packageRootPath: string,
  productName: string,
  packageVersion: string
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

  // Define package version macro (matches template line 689-695)
  if (packageVersion) {
    cSettings.push(`.define("EXPO_MODULES_CORE_VERSION", to: "${packageVersion}")`);
    cxxSettings.push(`.define("EXPO_MODULES_CORE_VERSION", to: "${packageVersion}")`);
  }

  // Define RCT_NEW_ARCH_ENABLED
  cSettings.push('.define("RCT_NEW_ARCH_ENABLED")');
  cxxSettings.push('.define("RCT_NEW_ARCH_ENABLED")');

  // Enable C++ and Clang modules (matches template line 699-700)
  cSettings.push('.unsafeFlags(["-fcxx-modules", "-fmodules"])');
  cxxSettings.push('.unsafeFlags(["-fcxx-modules", "-fmodules"])');

  // Enable C++ interop for Objective-C targets (matches template line 701)
  // This allows .m files to use C++ headers from React Native
  if (target.type === 'objc') {
    cSettings.push('.unsafeFlags(["-x", "objective-c++"])');
  }

  // Add VFS overlays and header maps for React if present
  const vfsFlags = collectVfsAndHeaderMapFlags(externalDeps, packageRootPath);
  if (vfsFlags.length > 0) {
    const flagString = `[${vfsFlags.map((f) => `"${f}"`).join(', ')}]`;
    cSettings.push(`.unsafeFlags(${flagString})`);
    cxxSettings.push(`.unsafeFlags(${flagString})`);
  }

  return { cSettings, cxxSettings };
}

/**
 * Collects VFS overlay, header map, and include directory flags for external dependencies
 * Mimics the template's resolveDependencies function to extract include paths from framework dependencies
 * Converts relative paths to absolute paths as required by the compiler
 */
function collectVfsAndHeaderMapFlags(externalDeps: string[], packageRootPath: string): string[] {
  const flags: string[] = [];

  for (const depName of externalDeps) {
    const config = getExternalDependencyConfig(depName.toLowerCase());
    if (config) {
      // Add VFS overlay if present (must be absolute path)
      if (config.vfsOverlayPath) {
        const absolutePath = path.resolve(packageRootPath, config.vfsOverlayPath);
        flags.push('-ivfsoverlay', absolutePath);
      }

      // Add include directories from the framework (e.g., Headers, React_Core)
      // This is critical - without these, headers like jsi/jsi.h won't be found
      if (config.includeDirectories) {
        for (const includeDir of config.includeDirectories) {
          const includePath = path.resolve(packageRootPath, config.path, includeDir);
          flags.push('-I', includePath);
        }
      }

      // Add header map if present (must be absolute path)
      if (config.headerMapPath) {
        const absolutePath = path.resolve(packageRootPath, config.headerMapPath);
        flags.push('-I', absolutePath);
      }
    }
  }

  return flags;
}

// ============================================================================
// Main Export: SPMPackage
// ============================================================================

export const SPMPackage = {
  /**
   * Generates Package.swift content from SPM configuration.
   * This produces a flat Package.swift without helper classes.
   *
   * @param pkg The package to generate for
   * @param buildType Debug or Release build flavor
   * @param productTargets Record mapping product names to their target definitions
   * @returns The Package.swift content as a string
   */
  async generatePackageSwiftAsync(
    pkg: Package,
    buildType: BuildFlavor,
    productTargets: Record<string, string[]>
  ): Promise<string> {
    const spmConfig = await pkg.getSwiftPMConfigurationAsync();
    if (!spmConfig) {
      throw new Error(`No SwiftPM configuration found for package: ${pkg.packageName}`);
    }

    // Build context for generation
    const context = await buildPackageSwiftContext(pkg, spmConfig, buildType);
    return generatePackageSwiftContent(context);
  },

  /**
   * Writes a Package.swift file to a specified path.
   * Useful for comparison purposes.
   *
   * @param pkg The package to generate for
   * @param buildType Debug or Release build flavor
   * @param outputPath Path to write the Package.swift file
   */
  async writePackageSwiftAsync(
    pkg: Package,
    buildType: BuildFlavor,
    outputPath: string
  ): Promise<void> {
    const content = await SPMPackage.generatePackageSwiftAsync(pkg, buildType, {});
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content, 'utf-8');
  },

  /**
   * Returns the default output path for the generated Package.swift.
   * This uses a separate filename to allow comparison with the existing Package.swift.
   *
   * @param pkg The package
   * @returns Path to the Package.swift file
   */
  getPackageSwiftPath(pkg: Package): string {
    return path.join(pkg.path, 'Package.swift');
  },

  /**
   * Returns a path for the new-style Package.swift for comparison purposes.
   *
   * @param pkg The package
   * @returns Path to Package.new.swift
   */
  getComparisonPackageSwiftPath(pkg: Package): string {
    return path.join(pkg.path, 'Package.new.swift');
  },
};

// ============================================================================
// Context Building
// ============================================================================

/**
 * Builds the complete context needed for Package.swift generation
 */
async function buildPackageSwiftContext(
  pkg: Package,
  spmConfig: SPMConfig,
  buildType: BuildFlavor
): Promise<PackageSwiftContext> {
  // Build target map for quick lookup
  const targetMap = new Map<string, SPMTarget>();
  for (const target of spmConfig.targets) {
    targetMap.set(target.name, target);
  }

  // Collect all resolved targets
  const resolvedTargets: ResolvedTarget[] = [];
  const addedTargets = new Set<string>();

  // Process each product's targets
  for (const product of spmConfig.products) {
    for (const targetName of product.targets) {
      if (addedTargets.has(targetName)) {
        continue;
      }

      const target = targetMap.get(targetName);
      if (!target) {
        throw new Error(`Target '${targetName}' not found in configuration`);
      }

      // Skip framework targets from source targets - they're handled as external deps
      if (target.type === 'framework') {
        continue;
      }

      const resolved = resolveSourceTarget(target, pkg, product.name, target.dependencies || []);
      resolvedTargets.push(resolved);
      addedTargets.add(targetName);
    }
  }

  // Add external dependencies as binary targets
  const externalDeps = spmConfig.externalDependencies || [];
  for (const depName of externalDeps) {
    const normalizedName = depName.charAt(0).toLowerCase() + depName.slice(1);

    // Check if it's a known React Native ecosystem dependency
    const externalConfig = getExternalDependencyConfig(normalizedName);
    if (externalConfig) {
      resolvedTargets.push(resolveBinaryTarget(externalConfig.name, externalConfig.path));
      continue;
    }

    // Check if it's an expo package dependency
    const expoPackagePath = path.join(pkg.path, '..', depName);
    if (await fs.pathExists(expoPackagePath)) {
      const expoPkg = new Package(expoPackagePath);
      const expoSpmConfig = await expoPkg.getSwiftPMConfigurationAsync();

      if (expoSpmConfig) {
        // Add binary targets for each product from the expo package
        for (const product of expoSpmConfig.products) {
          const frameworkPath = path.relative(
            pkg.path,
            Frameworks.getFrameworkPath(expoPkg, product, buildType)
          );
          resolvedTargets.push(resolveBinaryTarget(product.name, frameworkPath));
        }
      }
    }
  }

  // Build products with top-level targets only
  const products = spmConfig.products.map((product) => ({
    name: product.name,
    targets: getTopLevelTargetNames(spmConfig, product.name),
  }));

  return {
    packageName: pkg.packageName,
    packageVersion: pkg.packageVersion,
    packageRootPath: pkg.path,
    platforms: spmConfig.platforms,
    swiftLanguageVersions: spmConfig.swiftLanguageVersions,
    products,
    targets: resolvedTargets,
  };
}
