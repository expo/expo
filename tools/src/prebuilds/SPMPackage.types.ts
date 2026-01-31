/**
 * Types for SPMPackage - Clean Package.swift generation from SPM configuration.
 */

import { SPMProduct } from './SPMConfig.types';

// =============================================================================
// SPM Remote Package Dependencies
// =============================================================================

/**
 * Version specification for an SPM package dependency.
 * Use `exact` for reproducible builds (recommended).
 */
export type SPMPackageVersion =
  | { exact: string } // .package(url:, exact: "4.5.0")
  | { from: string } // .package(url:, from: "4.0.0")
  | { branch: string } // .package(url:, branch: "main")
  | { revision: string }; // .package(url:, revision: "abc123")

/**
 * A remote SPM package dependency declaration.
 * These are resolved by Swift Package Manager at build time.
 */
export interface SPMPackageDependency {
  /** Git URL of the SPM package repository (e.g., "https://github.com/airbnb/lottie-spm.git") */
  url: string;

  /** The product name exported by the package (what you import, e.g., "Lottie") */
  productName: string;

  /**
   * Package identifier for .product(package:) reference.
   * Defaults to last URL path component without .git (e.g., "lottie-spm" from URL above)
   */
  packageName?: string;

  /** Version requirement. Use `exact` for reproducible builds. */
  version: SPMPackageVersion;
}

/**
 * Resolved SPM package dependency for Package.swift generation.
 * Contains the computed package name and formatted version requirement.
 */
export interface ResolvedSPMPackage {
  /** Git URL */
  url: string;

  /** Package identifier for .product(package:) reference */
  packageName: string;

  /** Product name for .product(name:) reference */
  productName: string;

  /** Formatted version requirement string for Package.swift (e.g., 'exact: "4.5.0"') */
  versionRequirement: string;
}

/**
 * Target dependency - can be a simple string (binary target) or product reference (SPM package)
 */
export type ResolvedTargetDependency =
  | string // For binary targets: "Hermes"
  | { product: string; package: string }; // For SPM packages: .product(name: "Lottie", package: "lottie-spm")

// =============================================================================
// External Dependency Configuration
// =============================================================================

/**
 * External dependency configuration for React Native ecosystem dependencies
 */
export interface ExternalDependencyConfig {
  name: string;
  /** Path to the xcframework (relative to Package.swift location for binary target) */
  path: string;
  /** Include directories relative to the xcframework path */
  includeDirectories?: string[];
  /** Absolute path to header map file (for compiler flags) */
  headerMapPath?: string;
  /** Absolute path to VFS overlay file (for compiler flags) */
  vfsOverlayPath?: string;
  /** Absolute base path to the artifact folder (for computing include paths) */
  absoluteBasePath?: string;
}

/**
 * Resolved target with computed paths for Package.swift generation
 */
export interface ResolvedTarget {
  type: 'swift' | 'objc' | 'cpp' | 'binary';
  name: string;
  path: string;
  /** Dependencies - strings for binary targets, or { product, package } for SPM packages */
  dependencies: ResolvedTargetDependency[];
  linkedFrameworks: string[];
  publicHeadersPath?: string;
  // For source targets
  cSettings?: string[];
  cxxSettings?: string[];
  swiftSettings?: string[];
  linkerSettings?: string[];
  // Resources to include in the target
  resources?: { path: string; rule: 'process' | 'copy' }[];
  // For binary targets
  includeDirectories?: string[];
}

/**
 * Context for Package.swift generation containing all resolved information
 */
export interface PackageSwiftContext {
  packageName: string;
  packageVersion: string;
  packageRootPath: string;
  platforms: string[];
  swiftLanguageVersions?: string[];
  product: SPMProduct;
  targets: ResolvedTarget[];
  /** Remote SPM packages to declare at package level */
  spmPackages?: ResolvedSPMPackage[];
  /** Artifact paths from the centralized cache (optional for backward compatibility) */
  artifactPaths?: {
    hermes: string;
    reactNativeDependencies: string;
    react: string;
  };
}
