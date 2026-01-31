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
 * A resource to include in the target bundle
 */
export interface TargetResource {
  /** Path or glob pattern to the resource(s) relative to the target path */
  path: string;
  /** How to handle the resource: 'process' optimizes for platform, 'copy' includes as-is */
  rule?: 'process' | 'copy';
}

/**
 * Defines how files from a source location should be copied to a different destination
 * This is useful when source files use include paths that don't match their actual location
 */
export interface FileMapping {
  /** Glob pattern to match source files relative to the target path */
  from: string;
  /** Destination path relative to the generated target folder. Use '{filename}' as placeholder for the matched filename */
  to: string;
  /** Whether this is for header files (placed in include/) or source files (placed in target root), or symlink (creates directory symlink) */
  type: 'source' | 'header' | 'symlink';
}

/**
 * Compiler flags separated by language (C vs C++)
 */
export interface CompilerFlagsPerLanguage {
  /** Flags for C/Objective-C compilation only */
  c?: string[];
  /** Flags for C++/Objective-C++ compilation only */
  cxx?: string[];
}

/**
 * A single variant of compiler flags - either an array (both C and C++) or per-language object
 */
export type CompilerFlagsVariant = string[] | CompilerFlagsPerLanguage;

/**
 * Structured compiler flags with build-type variants.
 * Supports multiple shorthand forms:
 * - Array: `["-DFOO=1"]` → applied to all builds, both C and C++
 * - Object with common/debug/release: `{ common: [...], debug: [...] }`
 * - Each variant can be array or per-language: `{ common: { c: [...], cxx: [...] } }`
 */
export type CompilerFlags =
  | string[] // Shorthand: array = common flags for both c and cxx
  | {
      /** Flags applied to all builds (Debug and Release) */
      common?: CompilerFlagsVariant;
      /** Flags applied only to Debug builds */
      debug?: CompilerFlagsVariant;
      /** Flags applied only to Release builds */
      release?: CompilerFlagsVariant;
    };

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
  /** Resources to bundle with the target (e.g., Metal shaders, assets) */
  resources?: TargetResource[];
  /** Compiler flags for C/C++/ObjC. Can be an array (applied to all builds) or an object
   * with common/debug/release keys. Each key can be an array (both C and C++) or an object
   * with c/cxx keys. */
  compilerFlags?: CompilerFlags;
  /** File mappings to reorganize files during source generation. Files matching 'from' pattern
   * will be copied to the 'to' location instead of preserving their original directory structure */
  fileMapping?: FileMapping[];
  /** Custom module.modulemap content for this target. If provided, this will be written to the
   * include directory instead of letting Clang auto-generate one. Useful for C++ headers that
   * have conflicting type definitions and need to be marked as 'textual header' */
  moduleMapContent?: string;
  /** Whether to expose headers as public module headers. Set to false to make headers private/internal,
   * which prevents Clang from building a module from them. Useful for C++ headers with conflicting
   * type definitions that can't be included together. Default is true. */
  publicHeaders?: boolean;
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
  /** The CocoaPods pod name for this product. Must match the name in the corresponding .podspec file. */
  podName: string;
  /** The React Native codegen module name (from package.json codegenConfig.name). Only required for packages that use React Native codegen. */
  codegenName?: string;
  /** Supported platforms for this product */
  platforms: ProductPlatform[];
  /** List of external Swift Package dependencies for this product */
  externalDependencies?: ExternalDependency[];
  /** Optional list of Swift language versions supported by this product */
  swiftLanguageVersions?: string[];
  /** List of targets included in this product */
  targets: SPMTarget[];
  /** Glob patterns for headers that should be marked as 'textual' in the final xcframework modulemap.
   * Textual headers are not compiled as part of the module, which is necessary for headers that
   * have external dependencies (like React headers) that won't be available at module compile time.
   * This allows Swift to import the module without needing those dependencies at compile time.
   * Example: ["RCT*.h", "RNS*ComponentView.h"] */
  textualHeaders?: string[];
  /** Glob patterns for headers that should be excluded from the umbrella header.
   * These headers won't be automatically imported when the module is imported.
   * Use this for headers that extend external types (like React categories) or
   * reference files that don't exist (like Swift bridging headers for non-Swift modules).
   * Example: ["RCT*.h", "Swift-Bridging.h"] */
  excludeFromUmbrella?: string[];
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
