/**
 * RSC Specifier Registry
 *
 * Simple Map that captures import specifiers during Metro resolution.
 * Used to generate stable IDs for React Server Components.
 *
 * Key insight: We only need to capture bare specifiers (package imports).
 * App-level files use relative paths which are already stable.
 */

// Global registry: resolvedPath -> specifier
// Key: absolute file path (e.g., "/path/to/node_modules/pkg/client.js")
// Value: import specifier (e.g., "pkg/client")
const specifierRegistry = new Map<string, string>();

/**
 * Record a resolution: maps resolved file path to its import specifier.
 */
export function captureSpecifier(resolvedPath: string, specifier: string): void {
  // Only capture bare specifiers (not relative imports)
  // Relative imports like "./foo" are already stable IDs
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    specifierRegistry.set(resolvedPath, specifier);
  }
}

/**
 * Get the captured specifier for a resolved path.
 */
export function getSpecifier(resolvedPath: string): string | undefined {
  return specifierRegistry.get(resolvedPath);
}

/**
 * Clear the registry (for watch mode rebuilds).
 */
export function clearRegistry(): void {
  specifierRegistry.clear();
}

/**
 * Check if a path is inside node_modules.
 */
export function isNodeModulePath(filePath: string): boolean {
  return filePath.includes('/node_modules/') || filePath.includes('\\node_modules\\');
}

/**
 * Get stable ID for a module.
 *
 * For node_modules: use captured specifier or fallback to relative path
 * For app-level: use relative path from project root
 */
export function getStableId(
  resolvedPath: string,
  projectRoot: string
): { stableId: string; source: 'capture' | 'relative' } {
  // Try captured specifier first
  const specifier = specifierRegistry.get(resolvedPath);
  if (specifier) {
    return { stableId: specifier, source: 'capture' };
  }

  // Fallback to relative path
  const path = require('path');
  const relative = path.relative(projectRoot, resolvedPath);
  const posixPath = relative.split(path.sep).join('/');

  return {
    stableId: './' + posixPath,
    source: 'relative',
  };
}

// Debug: dump registry contents
export function debugRegistry(): void {
  console.log('\n=== RSC Specifier Registry ===');
  console.log(`Total entries: ${specifierRegistry.size}`);
  for (const [path, specifier] of specifierRegistry) {
    console.log(`  ${specifier} -> ${path.slice(-60)}`);
  }
  console.log('==============================\n');
}
