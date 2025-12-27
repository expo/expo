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

import * as path from 'path';

// stableId → filePath (for dev mode module resolution)
const clientBoundaries = new Map<string, string>();

/**
 * Normalize path for cross-platform consistency.
 */
function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Generate a stable ID for RSC client/server boundary modules.
 *
 * Uses relative paths from project root, with pnpm symlink normalization.
 * This matches the logic in babel-preset-expo's client-module-proxy-plugin.
 */
export function getStableId(
  filePath: string,
  projectRoot: string
): { stableId: string; source: 'relative' } {
  let relativePath = path.relative(projectRoot, filePath);

  // pnpm normalization: .pnpm/pkg@1.0.0/node_modules/pkg/... → pkg/...
  relativePath = relativePath.replace(
    /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
    'node_modules/'
  );

  return {
    stableId: './' + toPosixPath(relativePath),
    source: 'relative',
  };
}

/**
 * Record a client boundary for dev mode module resolution.
 */
export function recordClientBoundary(stableId: string, filePath: string): void {
  clientBoundaries.set(stableId, filePath);
}

/**
 * Get file path by stable ID (for dev mode module resolution).
 */
export function getFilePathByStableId(stableId: string): string | undefined {
  return clientBoundaries.get(stableId);
}

/**
 * Clear the registry (for watch mode rebuilds).
 */
export function clearRegistry(): void {
  clientBoundaries.clear();
}

/**
 * Get all discovered client boundaries.
 */
export function getDiscoveredClientBoundaries(): Map<string, string> {
  return new Map(clientBoundaries);
}

/**
 * Clear discovered boundaries.
 */
export function clearDiscoveredBoundaries(): void {
  clientBoundaries.clear();
}
