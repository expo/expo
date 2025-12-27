/**
 * RSC Registry
 *
 * Simple registry for RSC client boundaries in dev mode.
 * Maps output keys to file paths for module resolution.
 *
 * Output keys are relative paths from project root with pnpm normalization:
 * - App files: ./src/Button.tsx
 * - Packages: ./node_modules/pkg/file.js
 */
/**
 * Generate an output key for RSC client/server boundary modules.
 *
 * Uses relative paths from project root, with pnpm symlink normalization.
 * This matches the logic in babel-preset-expo's client-module-proxy-plugin.
 */
export declare function getOutputKey(filePath: string, projectRoot: string): {
    outputKey: string;
    source: 'relative';
};
/**
 * Record a client boundary for dev mode module resolution.
 */
export declare function recordClientBoundary(outputKey: string, filePath: string): void;
/**
 * Get file path by output key (for dev mode module resolution).
 */
export declare function getFilePathByOutputKey(outputKey: string): string | undefined;
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
