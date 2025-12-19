/**
 * Types for SPMPackage - Clean Package.swift generation from SPM configuration.
 */

/**
 * External dependency configuration for React Native ecosystem dependencies
 */
export interface ExternalDependencyConfig {
  name: string;
  path: string;
  includeDirectories?: string[];
  headerMapPath?: string;
  vfsOverlayPath?: string;
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
  // For source targets
  cSettings?: string[];
  cxxSettings?: string[];
  swiftSettings?: string[];
  linkerSettings?: string[];
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
  products: {
    name: string;
    targets: string[];
  }[];
  targets: ResolvedTarget[];
}
