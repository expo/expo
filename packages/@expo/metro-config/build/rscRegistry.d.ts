/**
 * RSC Specifier Registry
 *
 * Captures import specifiers during Metro resolution for stable RSC IDs.
 *
 * Features:
 * 1. Bare specifiers (pkg, @scope/pkg) - captured directly
 * 2. Relative imports within packages - canonical specifier computed from context
 * 3. Collision detection - auto-adds version suffix when same ID maps to different files
 * 4. **Exports reverse lookup** - maps resolved file paths back to export specifiers
 *
 * **Package detection uses package.json boundaries, NOT path heuristics.**
 * This works correctly with pnpm, yarn, npm, and monorepo workspace packages.
 *
 * **Specifier resolution priority:**
 * 1. Captured import specifier (from Metro resolution)
 * 2. Exports field reverse lookup (file path → export specifier)
 * 3. Computed from package boundary (fallback)
 */
interface PackageInfo {
    name: string;
    version: string;
    root: string;
}
/**
 * Set the project root for package detection.
 * Call this once at Metro startup.
 */
export declare function setProjectRoot(projectRoot: string): void;
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
 * Get stable ID for a module.
 *
 * Uses package.json boundaries to distinguish packages from app-level files.
 * NO path heuristics like "/node_modules/" are used.
 *
 * Priority:
 * 1. Captured specifier from registry (highest priority - actual import specifier)
 * 2. Exports field reverse lookup (file path → export specifier)
 * 3. Computed from package.json boundary (fallback for packages without exports)
 * 4. Relative path from project root (for app-level files)
 */
export declare function getStableId(resolvedPath: string, projectRoot: string): {
    stableId: string;
    source: 'capture' | 'exports' | 'computed' | 'relative';
};
/**
 * Debug: dump registry contents.
 */
export declare function debugRegistry(): void;
/**
 * Get file path by stable ID (reverse lookup).
 * Used to convert stable IDs back to file paths for bundle URLs in dev mode.
 */
export declare function getFilePathByStableId(stableId: string): string | undefined;
export declare function recordClientBoundary(stableId: string, filePath: string): void;
export declare function getDiscoveredClientBoundaries(): Map<string, string>;
export declare function clearDiscoveredBoundaries(): void;
/**
 * Export findPackageInfo for use in other modules.
 */
export { findPackageInfo };
