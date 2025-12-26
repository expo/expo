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

import * as path from 'path';
import * as fs from 'fs';

// resolvedPath → stableId
const specifierRegistry = new Map<string, string>();

// stableId → resolvedPath (reverse mapping for collision detection)
const stableIdToPath = new Map<string, string>();

// Track which IDs have been upgraded to versioned format due to collision
const versionedIds = new Set<string>();

// Cache for package.json lookups: filePath → { name, version, root }
const packageJsonCache = new Map<string, PackageInfo | null>();

interface PackageInfo {
  name: string;
  version: string;
  root: string;
}

/**
 * Normalize path for cross-platform consistency.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\+/g, '/');
}

/**
 * Find package.json and extract package info for a file path.
 */
function findPackageInfo(filePath: string): PackageInfo | null {
  const normalized = normalizePath(filePath);

  // Check cache first (use directory as cache key for efficiency)
  const dir = path.dirname(filePath);
  const cached = packageJsonCache.get(dir);
  if (cached !== undefined) {
    return cached;
  }

  // Walk up to find package.json
  let currentDir = dir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const pkgPath = path.join(currentDir, 'package.json');
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) {
          const result: PackageInfo = {
            name: pkg.name,
            version: pkg.version || '0.0.0',
            root: currentDir,
          };
          packageJsonCache.set(dir, result);
          return result;
        }
      }
    } catch {
      // Ignore errors, continue searching
    }
    currentDir = path.dirname(currentDir);
  }

  packageJsonCache.set(dir, null);
  return null;
}

/**
 * Compute relative path within package (without extension, without trailing /index).
 */
function computeRelativePath(resolvedPath: string, packageRoot: string): string {
  let relativePath = path.relative(packageRoot, resolvedPath);
  relativePath = normalizePath(relativePath);

  // Remove extension
  relativePath = relativePath.replace(/\.(js|jsx|ts|tsx|mjs|cjs)$/, '');

  // Remove trailing /index
  relativePath = relativePath.replace(/\/index$/, '');

  return relativePath;
}

/**
 * Create a simple stable ID (without version).
 */
function createSimpleId(packageName: string, relativePath: string): string {
  if (!relativePath || relativePath === 'index') {
    return packageName;
  }
  return `${packageName}/${relativePath}`;
}

/**
 * Create a versioned stable ID.
 */
function createVersionedId(packageName: string, version: string, relativePath: string): string {
  if (!relativePath || relativePath === 'index') {
    return `${packageName}@${version}`;
  }
  return `${packageName}@${version}/${relativePath}`;
}

/**
 * Handle collision: upgrade both old and new entries to versioned IDs.
 */
function handleCollision(
  existingPath: string,
  newPath: string,
  simpleId: string
): { existingNewId: string; newNewId: string } {
  const existingPkgInfo = findPackageInfo(existingPath);
  const newPkgInfo = findPackageInfo(newPath);

  if (!existingPkgInfo || !newPkgInfo) {
    // Shouldn't happen, but fallback to hash if package info missing
    const existingHash = Buffer.from(existingPath).toString('base64').slice(0, 8);
    const newHash = Buffer.from(newPath).toString('base64').slice(0, 8);
    return {
      existingNewId: `${simpleId}#${existingHash}`,
      newNewId: `${simpleId}#${newHash}`,
    };
  }

  const existingRelPath = computeRelativePath(existingPath, existingPkgInfo.root);
  const newRelPath = computeRelativePath(newPath, newPkgInfo.root);

  return {
    existingNewId: createVersionedId(existingPkgInfo.name, existingPkgInfo.version, existingRelPath),
    newNewId: createVersionedId(newPkgInfo.name, newPkgInfo.version, newRelPath),
  };
}

/**
 * Check if two paths are from the same package version (environment-specific resolution)
 * vs different package versions (true collision).
 */
function isSamePackageVersion(path1: string, path2: string): boolean {
  // Handle node: prefixed paths (server-side specifiers)
  // These are environment-specific resolutions, not true collisions
  // e.g., "node:@babel/runtime/helpers/extends" vs "/path/to/@babel/runtime/helpers/esm/extends.js"
  // Note: Virtual modules have \0 prefix (e.g., "\0node:react")
  const isNodePrefixed1 = path1.startsWith('node:') || path1.startsWith('\0node:');
  const isNodePrefixed2 = path2.startsWith('node:') || path2.startsWith('\0node:');

  if (isNodePrefixed1 || isNodePrefixed2) {
    // If one is node: prefixed and the other is a file path, check if they reference the same package
    const realPath1 = isNodePrefixed1 ? null : path1;
    const realPath2 = isNodePrefixed2 ? null : path2;
    const realPath = realPath1 || realPath2;

    if (realPath) {
      // Extract package name from the node: specifier
      // Handle both "node:pkg" (5 chars) and "\0node:pkg" (6 chars)
      const nodePath = isNodePrefixed1 ? path1 : path2;
      const prefixLen = nodePath.startsWith('\0node:') ? 6 : 5;
      const nodeSpecifier = nodePath.slice(prefixLen);
      const pkgInfo = findPackageInfo(realPath);

      if (pkgInfo) {
        // Check if the node: specifier starts with the same package name
        // e.g., "@babel/runtime/helpers/extends" matches package "@babel/runtime"
        if (nodeSpecifier === pkgInfo.name || nodeSpecifier.startsWith(pkgInfo.name + '/')) {
          return true; // Same package, different environments
        }
      }
    }

    // Both are node: prefixed, or couldn't determine - treat as same to avoid false collisions
    if (isNodePrefixed1 && isNodePrefixed2) {
      return true;
    }

    // Can't determine, default to treating as collision for safety
    return false;
  }

  const pkg1 = findPackageInfo(path1);
  const pkg2 = findPackageInfo(path2);

  if (!pkg1 || !pkg2) {
    return false;
  }

  // Same package name AND same version = environment-specific resolution
  // Different version = true collision (multiple versions in dependency tree)
  return pkg1.name === pkg2.name && pkg1.version === pkg2.version;
}

/**
 * Register a stable ID, handling collisions automatically.
 *
 * Environment-specific resolutions (same package, same version, different entry points
 * like index.js vs react-server.js) are NOT collisions - we just overwrite.
 *
 * True collisions (same package name, different versions) get versioned IDs.
 */
function registerStableId(resolvedPath: string, stableId: string): void {
  const normalizedPath = normalizePath(resolvedPath);

  // Already registered with this exact ID?
  if (specifierRegistry.get(normalizedPath) === stableId) {
    return;
  }

  // Check for collision: same ID, different path
  const existingPath = stableIdToPath.get(stableId);

  if (existingPath && existingPath !== normalizedPath) {
    // Check if this is an environment-specific resolution (same package version)
    // vs a true collision (different package versions)
    if (isSamePackageVersion(existingPath, normalizedPath)) {
      // Environment-specific resolution (e.g., react.react-server.js vs react/index.js)
      // Just overwrite - the last resolution wins (typically the client environment)
      specifierRegistry.set(normalizedPath, stableId);
      stableIdToPath.set(stableId, normalizedPath);
      return;
    }

    // True collision: different versions of the same package
    console.warn(
      `[RSC] Version collision detected for "${stableId}":\n` +
        `  - ${existingPath}\n` +
        `  - ${normalizedPath}\n` +
        `  Upgrading to versioned IDs.`
    );

    const { existingNewId, newNewId } = handleCollision(existingPath, normalizedPath, stableId);

    // Update existing entry
    specifierRegistry.set(existingPath, existingNewId);
    stableIdToPath.delete(stableId);
    stableIdToPath.set(existingNewId, existingPath);
    versionedIds.add(stableId);

    // Register new entry with versioned ID
    specifierRegistry.set(normalizedPath, newNewId);
    stableIdToPath.set(newNewId, normalizedPath);
  } else {
    // No collision, register normally
    specifierRegistry.set(normalizedPath, stableId);
    stableIdToPath.set(stableId, normalizedPath);
  }
}

/**
 * Record a resolution: maps resolved file path to its import specifier.
 *
 * @param resolvedPath - The absolute path of the resolved module
 * @param specifier - The import specifier used (e.g., "pkg", "./foo")
 * @param originModulePath - Optional: the file that contains the import (for relative imports)
 */
export function captureSpecifier(
  resolvedPath: string,
  specifier: string,
  originModulePath?: string
): void {

  const normalizedResolved = normalizePath(resolvedPath);

  // Already captured?
  if (specifierRegistry.has(normalizedResolved)) {
    return;
  }

  // Case 1: Bare specifier (pkg, @scope/pkg, pkg/subpath)
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    registerStableId(resolvedPath, specifier);
    return;
  }

  // Case 2: Relative import from within node_modules
  // Compute canonical specifier from resolution context
  if (originModulePath && isNodeModulePath(originModulePath) && isNodeModulePath(resolvedPath)) {
    const pkgInfo = findPackageInfo(resolvedPath);
    if (pkgInfo) {
      const relativePath = computeRelativePath(resolvedPath, pkgInfo.root);
      const simpleId = createSimpleId(pkgInfo.name, relativePath);

      // Check if this base ID was already marked as needing versions due to collision
      if (versionedIds.has(simpleId)) {
        const versionedId = createVersionedId(pkgInfo.name, pkgInfo.version, relativePath);
        registerStableId(resolvedPath, versionedId);
      } else {
        registerStableId(resolvedPath, simpleId);
      }
    }
  }

  // Case 3: App-level relative imports - don't capture
  // These will use relative path from project root as stable ID
}

/**
 * Get the captured specifier for a resolved path.
 */
export function getSpecifier(resolvedPath: string): string | undefined {
  return specifierRegistry.get(normalizePath(resolvedPath));
}

/**
 * Clear the registry (for watch mode rebuilds).
 */
export function clearRegistry(): void {
  specifierRegistry.clear();
  stableIdToPath.clear();
  versionedIds.clear();
  packageJsonCache.clear();
}

/**
 * Check if a path is inside node_modules.
 * Handles both absolute paths (/foo/node_modules/...) and relative paths (node_modules/...)
 */
export function isNodeModulePath(filePath: string): boolean {
  return (
    filePath.includes('/node_modules/') ||
    filePath.includes('\\node_modules\\') ||
    filePath.startsWith('node_modules/') ||
    filePath.startsWith('node_modules\\')
  );
}

/**
 * Get stable ID for a module.
 *
 * For node_modules: use captured specifier (throws if not found)
 * For app-level: use relative path from project root
 */
export function getStableId(
  resolvedPath: string,
  projectRoot: string
): { stableId: string; source: 'capture' | 'relative' } {
  // Normalize path for consistent lookup
  const normalizedPath = normalizePath(resolvedPath);

  // Try captured specifier first
  const specifier = specifierRegistry.get(normalizedPath);
  if (specifier) {
    return { stableId: specifier, source: 'capture' };
  }

  // For node_modules, we MUST have a captured specifier
  // If not found, it means the resolution wasn't captured properly
  if (isNodeModulePath(normalizedPath)) {
    // Find similar paths in registry for debugging
    const similarPaths = Array.from(specifierRegistry.entries())
      .filter(([regPath]) => {
        // Check if the registry path ends with something similar
        const regFilename = regPath.split('/').pop();
        const lookupFilename = normalizedPath.split('/').pop();
        return regFilename === lookupFilename;
      })
      .slice(0, 5)
      .map(([regPath, spec]) => `  ${spec} -> ${regPath}`)
      .join('\n');

    const registryDump = Array.from(specifierRegistry.entries())
      .filter(([regPath]) => regPath.includes('node_modules'))
      .slice(0, 10)
      .map(([regPath, spec]) => `  ${spec} -> ...${regPath.slice(-60)}`)
      .join('\n');

    throw new Error(
      `[RSC] Missing specifier for node_modules path.\n` +
        `Lookup path: ${normalizedPath}\n` +
        `Original path: ${resolvedPath}\n` +
        `Project root: ${projectRoot}\n\n` +
        `Similar paths in registry:\n${similarPaths || '  (none)'}\n\n` +
        `Registry has ${specifierRegistry.size} entries. Sample node_modules entries:\n${registryDump || '  (none)'}\n\n` +
        `This usually means:\n` +
        `1. Path mismatch between Babel (deferred ID) and Metro resolution\n` +
        `2. Symlinks or realpath differences\n` +
        `3. The resolution happened in a different Metro instance or worker`
    );
  }

  // App-level files: use relative path from project root
  const relative = path.relative(projectRoot, resolvedPath);
  const posixPath = normalizePath(relative);

  return {
    stableId: './' + posixPath,
    source: 'relative',
  };
}

/**
 * Debug: dump registry contents.
 */
export function debugRegistry(): void {
  console.log('\n=== RSC Specifier Registry ===');
  console.log(`Total entries: ${specifierRegistry.size}`);
  console.log(`Versioned IDs: ${versionedIds.size}`);
  for (const [filePath, specifier] of specifierRegistry) {
    const isVersioned = specifier.includes('@') && !specifier.startsWith('@');
    const marker = isVersioned ? ' [v]' : '';
    console.log(`  ${specifier}${marker} -> ...${filePath.slice(-50)}`);
  }
  console.log('==============================\n');
}

/**
 * Get file path by stable ID (reverse lookup).
 * Used to convert stable IDs back to file paths for bundle URLs in dev mode.
 *
 * Checks both registries:
 * 1. stableIdToPath - populated during resolution for node_modules
 * 2. discoveredClientBoundaries - populated during RSC serialization for all boundaries
 */
export function getFilePathByStableId(stableId: string): string | undefined {
  // Check resolution registry first (node_modules)
  const fromResolution = stableIdToPath.get(stableId);
  if (fromResolution) {
    return fromResolution;
  }

  // Check discovery cache (app-level and all boundaries from serialization)
  return discoveredClientBoundaries.get(stableId);
}

// ============================================================================
// Client Boundary Discovery Cache
// ============================================================================
// In dev mode, RSC bundle is serialized first and discovers client boundaries.
// This cache stores those discoveries so the client bundle can include them.

// Maps stable ID → file path for client boundaries discovered during RSC serialization
const discoveredClientBoundaries = new Map<string, string>();

/**
 * Record a client boundary discovered during RSC serialization.
 * Called by the RSC serializer plugin.
 */
export function recordClientBoundary(stableId: string, filePath: string): void {
  discoveredClientBoundaries.set(stableId, filePath);
}

/**
 * Get all discovered client boundaries.
 * Used by transform-worker to include them in the client bundle.
 */
export function getDiscoveredClientBoundaries(): Map<string, string> {
  return new Map(discoveredClientBoundaries);
}

/**
 * Clear discovered client boundaries (for watch mode rebuilds).
 */
export function clearDiscoveredBoundaries(): void {
  discoveredClientBoundaries.clear();
}

/**
 * Export findPackageInfo for use in other modules.
 */
export { findPackageInfo };
