/**
 * RSC Specifier Registry
 *
 * Captures import specifiers during Metro resolution for stable RSC IDs.
 *
 * Features:
 * 1. Bare specifiers (pkg, @scope/pkg) - captured directly
 * 2. Relative imports within node_modules - canonical specifier computed from context
 * 3. Collision detection - auto-adds version suffix when same ID maps to different files
 *
 * App-level relative imports are NOT captured (use relative path as stable ID).
 */
interface PackageInfo {
    name: string;
    version: string;
    root: string;
}
/**
 * Find package.json and extract package info for a file path.
 */
declare function findPackageInfo(filePath: string): PackageInfo | null;
/**
 * Record a resolution: maps resolved file path to its import specifier.
 *
 * @param resolvedPath - The absolute path of the resolved module
 * @param specifier - The import specifier used (e.g., "pkg", "./foo")
 * @param originModulePath - Optional: the file that contains the import (for relative imports)
 */
export declare function captureSpecifier(resolvedPath: string, specifier: string, originModulePath?: string): void;
/**
 * Get the captured specifier for a resolved path.
 */
export declare function getSpecifier(resolvedPath: string): string | undefined;
/**
 * Clear the registry (for watch mode rebuilds).
 */
export declare function clearRegistry(): void;
/**
 * Check if a path is inside node_modules.
 * Handles both absolute paths (/foo/node_modules/...) and relative paths (node_modules/...)
 */
export declare function isNodeModulePath(filePath: string): boolean;
/**
 * Get stable ID for a module.
 *
 * For node_modules: use captured specifier (throws if not found)
 * For app-level: use relative path from project root
 */
export declare function getStableId(resolvedPath: string, projectRoot: string): {
    stableId: string;
    source: 'capture' | 'relative';
};
/**
 * Debug: dump registry contents.
 */
export declare function debugRegistry(): void;
/**
 * Get file path by stable ID (reverse lookup).
 * Used to convert stable IDs back to file paths for bundle URLs in dev mode.
 *
 * Checks both registries:
 * 1. stableIdToPath - populated during resolution for node_modules
 * 2. discoveredClientBoundaries - populated during RSC serialization for all boundaries
 */
export declare function getFilePathByStableId(stableId: string): string | undefined;
/**
 * Record a client boundary discovered during RSC serialization.
 * Called by the RSC serializer plugin.
 */
export declare function recordClientBoundary(stableId: string, filePath: string): void;
/**
 * Get all discovered client boundaries.
 * Used by transform-worker to include them in the client bundle.
 */
export declare function getDiscoveredClientBoundaries(): Map<string, string>;
/**
 * Clear discovered client boundaries (for watch mode rebuilds).
 */
export declare function clearDiscoveredBoundaries(): void;
/**
 * Export findPackageInfo for use in other modules.
 */
export { findPackageInfo };
