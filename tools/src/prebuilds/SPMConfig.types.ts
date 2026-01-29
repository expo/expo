/**
 * TypeScript types for SPM (Swift Package Manager) configuration.
 * These types match the schema defined in schemas/spm-config.schema.json
 */

/**
 * A binary xcframework target
 */
export interface FrameworkTarget {
  /** Target type identifier */
  type: 'framework';
  /** The name of the target */
  name: string;
  /** Path to the xcframework relative to package root */
  path: string;
  /** Header locations within the framework bundle */
  includeDirectories?: string[];
  /** Path to a header map file (.hmap) for header resolution */
  headerMapPath?: string;
  /** Path to a VFS overlay file (.yaml) for virtual filesystem mapping */
  vfsOverlayPath?: string;
  /** System frameworks to link */
  linkedFrameworks?: string[];
}

/**
 * Base interface for source targets (ObjC, Swift, C++)
 */
export interface SourceTarget {
  /** The name of the target */
  name: string;
  /** Module name for header organization (defaults to product name if not specified) */
  moduleName?: string;
  /** Path to source files relative to package root */
  path: string;
  /** Glob pattern to filter source files within the path */
  pattern?: string;
  /** Glob pattern to filter header files within the path */
  headerPattern?: string;
  /** Names of other targets this target depends on */
  dependencies?: string[];
  /** Paths to exclude from compilation */
  exclude?: string[];
  /** Header search paths relative to the target path */
  includeDirectories?: string[];
  /** System frameworks to link */
  linkedFrameworks?: string[];
}

/**
 * An Objective-C source target
 */
export interface ObjcTarget extends SourceTarget {
  /** Target type identifier */
  type: 'objc';
}

/**
 * A Swift source target
 */
export interface SwiftTarget extends SourceTarget {
  /** Target type identifier */
  type: 'swift';
}

/**
 * A C++ source target
 */
export interface CppTarget extends SourceTarget {
  /** Target type identifier */
  type: 'cpp';
}

/**
 * Union type for all SPM target types
 */
export type SPMTarget = FrameworkTarget | ObjcTarget | SwiftTarget | CppTarget;

/**
 * External dependencies that can be referenced by packages
 * Examples: 'Hermes', 'ReactNativeDependencies', 'React', or expo packages like 'ExpoModulesCore'
 */
export type ExternalDependency = string;

/**
 * Build platforms in the configuration
 */
export type BuildPlatform =
  | 'iOS'
  | 'iOS Simulator'
  | 'macOS'
  | 'macOS,variant=Mac Catalyst'
  | 'tvOS'
  | 'tvOS Simulator'
  | 'visionOS'
  | 'visionOS Simulator';

/**
 * Product platforms to emit to Package.swift
 */
export type ProductPlatform = 'iOS(.v15)' | 'macOS(.v11)' | 'tvOS(.v15)' | 'macCatalyst(.v15)';

/**
 * A Swift Package product definition
 * Products contain their own targets directly
 */
export interface SPMProduct {
  /** The name of the product */
  name: string;
  /** Supported platforms for this product */
  platforms: ProductPlatform[];
  /** List of external Swift Package dependencies for this product */
  externalDependencies?: ExternalDependency[];
  /** Optional list of Swift language versions supported by this product */
  swiftLanguageVersions?: string[];
  /** List of targets included in this product */
  targets: SPMTarget[];
}

/**
 * Configuration for Swift Package Manager packages and targets in Expo modules
 */
export interface SPMConfig {
  /** JSON Schema reference */
  $schema?: string;
  /** List of SPM products to generate with their targets */
  products: SPMProduct[];
}

/**
 * Product definition for CLI input - specifies which paths should be included in which product
 * Format: "ProductName:path1,path2,..." or "ProductName:*" for default/catch-all
 */
export interface ProductDefinition {
  /** The name of the product */
  name: string;
  /** Path patterns to include in this product (glob-style, relative to source root) */
  /** Use '*' as a special pattern to indicate "everything else not matched by other products" */
  pathPatterns: string[];
}

// Utility Types and Functions

/**
 * Result of computing the top-level dependencies for a product
 */
export interface ProductDependencies {
  /** Names of targets that have no dependents within the product (entry points) */
  topLevelTargets: string[];
  /** All target names in dependency order (topologically sorted) */
  allTargets: string[];
}
