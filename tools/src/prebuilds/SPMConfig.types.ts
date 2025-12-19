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
  /** Names of other ObjCTargets to include headers from (header-only dependency) */
  useIncludesFrom?: string[];
  /** SPM plugins to use for this target */
  plugins?: string[];
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
  /** Names of other targets to include headers from (header-only dependency) */
  useIncludesFrom?: string[];
  /** SPM plugins to use for this target */
  plugins?: string[];
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
 * Products reference targets by name from the root targets array
 */
export interface SPMProduct {
  /** The name of the product */
  name: string;
  /** List of target names to include in this product (references targets by name) */
  targets: string[];
}

/**
 * Configuration for Swift Package Manager packages and targets in Expo modules
 */
export interface SPMConfig {
  /** JSON Schema reference */
  $schema?: string;
  /** Supported platforms */
  platforms: ProductPlatform[];
  /** List of external Swift Package dependencies */
  externalDependencies?: ExternalDependency[];
  /** Flat list of all SPM targets */
  targets: SPMTarget[];
  /** List of SPM products to generate */
  products: SPMProduct[];
  /** Options list of Swift language versions */
  swiftLanguageVersions?: string[];
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

// ============================================================================
// Utility Types and Functions
// ============================================================================

/**
 * Result of computing the top-level dependencies for a product
 */
export interface ProductDependencies {
  /** Names of targets that have no dependents within the product (entry points) */
  topLevelTargets: string[];
  /** All target names in dependency order (topologically sorted) */
  allTargets: string[];
}

/**
 * Computes which targets are "top-level" (not depended upon by other targets in the product).
 * These are the targets that should be added to the product's target list in Package.swift.
 *
 * @param config The SPM configuration
 * @param productName The name of the product to analyze
 * @returns Object containing top-level targets and all targets in dependency order
 */
export function getProductDependencies(
  config: SPMConfig,
  productName: string
): ProductDependencies {
  const product = config.products.find((p) => p.name === productName);
  if (!product) {
    throw new Error(`Product '${productName}' not found in configuration`);
  }

  // Build a map of target name to target definition
  const targetMap = new Map<string, SPMTarget>();
  for (const target of config.targets) {
    targetMap.set(target.name, target);
  }

  // Get all targets referenced by this product
  const productTargetNames = new Set(product.targets);

  // Find all targets that are depended upon by other targets within this product
  const dependedUpon = new Set<string>();
  for (const targetName of productTargetNames) {
    const target = targetMap.get(targetName);
    if (target && 'dependencies' in target && target.dependencies) {
      for (const dep of target.dependencies) {
        if (productTargetNames.has(dep)) {
          dependedUpon.add(dep);
        }
      }
    }
  }

  // Top-level targets are those not depended upon by any other target in the product
  const topLevelTargets = Array.from(productTargetNames).filter((name) => !dependedUpon.has(name));

  // Topological sort for all targets
  const allTargets = topologicalSort(product.targets, targetMap);

  return {
    topLevelTargets,
    allTargets,
  };
}

/**
 * Gets the target definition by name from the configuration
 */
export function getTargetByName(config: SPMConfig, targetName: string): SPMTarget | undefined {
  return config.targets.find((t) => t.name === targetName);
}

/**
 * Gets only the top-level target names for a product.
 * Top-level targets are those not depended upon by any other target in the product.
 * This is useful for adding to a Package.swift product definition, as SPM will
 * automatically include transitive dependencies.
 *
 * @param config The SPM configuration
 * @param productName The name of the product to get top-level targets for
 * @returns Array of top-level target names
 *
 * @example
 * // In Package.swift generation:
 * // .library(name: "MyProduct", targets: [...getTopLevelTargetNames(config, "MyProduct")])
 */
export function getTopLevelTargetNames(config: SPMConfig, productName: string): string[] {
  return getProductDependencies(config, productName).topLevelTargets;
}

/**
 * Resolves all dependencies for a set of target names, including transitive dependencies
 *
 * @param config The SPM configuration
 * @param targetNames The target names to resolve dependencies for
 * @returns Array of all target names including transitive dependencies
 */
export function resolveAllDependencies(config: SPMConfig, targetNames: string[]): string[] {
  const targetMap = new Map<string, SPMTarget>();
  for (const target of config.targets) {
    targetMap.set(target.name, target);
  }

  const resolved = new Set<string>();
  const queue = [...targetNames];

  while (queue.length > 0) {
    const name = queue.shift()!;
    if (resolved.has(name)) {
      continue;
    }
    resolved.add(name);

    const target = targetMap.get(name);
    if (target && 'dependencies' in target && target.dependencies) {
      for (const dep of target.dependencies) {
        if (!resolved.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  return Array.from(resolved);
}

/**
 * Performs a topological sort on the given target names based on their dependencies
 */
function topologicalSort(targetNames: string[], targetMap: Map<string, SPMTarget>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const targetSet = new Set(targetNames);

  function visit(name: string) {
    if (visited.has(name) || !targetSet.has(name)) {
      return;
    }
    visited.add(name);

    const target = targetMap.get(name);
    if (target && 'dependencies' in target && target.dependencies) {
      for (const dep of target.dependencies) {
        visit(dep);
      }
    }
    result.push(name);
  }

  for (const name of targetNames) {
    visit(name);
  }

  return result;
}
