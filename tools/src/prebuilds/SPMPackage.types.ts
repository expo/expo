/**
 * Types for SPMPackage - Clean Package.swift generation from SPM configuration.
 */

import { SPMProduct } from './SPMConfig.types';

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
  dependencies: string[];
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
  /** Artifact paths from the centralized cache (optional for backward compatibility) */
  artifactPaths?: {
    hermes: string;
    reactNativeDependencies: string;
    react: string;
  };
}
