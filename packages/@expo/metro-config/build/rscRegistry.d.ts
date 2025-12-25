/**
 * RSC Specifier Registry
 *
 * Simple Map that captures import specifiers during Metro resolution.
 * Used to generate stable IDs for React Server Components.
 *
 * Key insight: We only need to capture bare specifiers (package imports).
 * App-level files use relative paths which are already stable.
 */
/**
 * Record a resolution: maps resolved file path to its import specifier.
 */
export declare function captureSpecifier(resolvedPath: string, specifier: string): void;
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
 */
export declare function isNodeModulePath(filePath: string): boolean;
/**
 * Get stable ID for a module.
 *
 * For node_modules: use captured specifier or fallback to relative path
 * For app-level: use relative path from project root
 */
export declare function getStableId(resolvedPath: string, projectRoot: string): {
    stableId: string;
    source: 'capture' | 'relative';
};
export declare function debugRegistry(): void;
