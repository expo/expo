/**
 * RSC Registry
 *
 * Simple registry for RSC client boundaries in dev mode.
 * Maps stable IDs to file paths for module resolution.
 *
 * Stable IDs are relative paths from project root with pnpm normalization:
 * - App files: ./src/Button.tsx
 * - Packages: ./node_modules/pkg/file.js
 */
/**
 * Generate a stable ID for RSC client/server boundary modules.
 *
 * Uses relative paths from project root, with pnpm symlink normalization.
 * This matches the logic in babel-preset-expo's client-module-proxy-plugin.
 */
export declare function getStableId(filePath: string, projectRoot: string): {
    stableId: string;
    source: 'relative';
};
/**
 * Record a client boundary for dev mode module resolution.
 */
export declare function recordClientBoundary(stableId: string, filePath: string): void;
/**
 * Get file path by stable ID (for dev mode module resolution).
 */
export declare function getFilePathByStableId(stableId: string): string | undefined;
/**
 * Clear the registry (for watch mode rebuilds).
 */
export declare function clearRegistry(): void;
/**
 * Get all discovered client boundaries.
 */
export declare function getDiscoveredClientBoundaries(): Map<string, string>;
/**
 * Clear discovered boundaries.
 */
export declare function clearDiscoveredBoundaries(): void;
