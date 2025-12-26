/**
 * RSC Specifier Registry
 *
 * Captures import specifiers during Metro resolution for stable RSC IDs.
 *
 * Features:
 * 1. Bare specifiers (pkg, @scope/pkg) - captured directly
 * 2. Relative imports within packages - canonical specifier computed from context
 * 3. Collision detection - auto-adds version suffix when same ID maps to different files
 *
 * **Package detection uses package.json boundaries, NOT path heuristics.**
 * This works correctly with pnpm, yarn, npm, and monorepo workspace packages.
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

// Project root for distinguishing app-level files from packages
let cachedProjectRoot: string | null = null;

interface PackageInfo {
  name: string;
  version: string;
  root: string;
}

/**
 * Set the project root for package detection.
 * Call this once at Metro startup.
 */
export function setProjectRoot(projectRoot: string): void {
  cachedProjectRoot = normalizePath(projectRoot);
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
 * Check if a file is a "package module" (belongs to a package that is NOT the project itself).
 * Uses package.json boundaries instead of path heuristics.
 *
 * Returns the package info if it's a package module, null otherwise.
 */
function getPackageModuleInfo(
  filePath: string,
  projectRoot?: string
): PackageInfo | null {
  const pkgInfo = findPackageInfo(filePath);
  if (!pkgInfo) {
    return null;
  }

  // Check if this package is the project root itself
  const normalizedPkgRoot = normalizePath(pkgInfo.root);
  const normalizedProjectRoot = projectRoot
    ? normalizePath(projectRoot)
    : cachedProjectRoot;

  // If the package root IS the project root, it's an app-level file, not a package module
  if (normalizedProjectRoot && normalizedPkgRoot === normalizedProjectRoot) {
    return null;
  }

  // It's a package module (has package.json with name AND is not the project root)
  return pkgInfo;
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
  const isNodePrefixed1 = path1.startsWith('node:') || path1.startsWith('\0node:');
  const isNodePrefixed2 = path2.startsWith('node:') || path2.startsWith('\0node:');

  if (isNodePrefixed1 || isNodePrefixed2) {
    const realPath1 = isNodePrefixed1 ? null : path1;
    const realPath2 = isNodePrefixed2 ? null : path2;
    const realPath = realPath1 || realPath2;

    if (realPath) {
      const nodePath = isNodePrefixed1 ? path1 : path2;
      const prefixLen = nodePath.startsWith('\0node:') ? 6 : 5;
      const nodeSpecifier = nodePath.slice(prefixLen);
      const pkgInfo = findPackageInfo(realPath);

      if (pkgInfo) {
        if (nodeSpecifier === pkgInfo.name || nodeSpecifier.startsWith(pkgInfo.name + '/')) {
          return true; // Same package, different environments
        }
      }
    }

    if (isNodePrefixed1 && isNodePrefixed2) {
      return true;
    }

    return false;
  }

  const pkg1 = findPackageInfo(path1);
  const pkg2 = findPackageInfo(path2);

  if (!pkg1 || !pkg2) {
    return false;
  }

  // Same package name AND same version = environment-specific resolution
  return pkg1.name === pkg2.name && pkg1.version === pkg2.version;
}

/**
 * Register a stable ID, handling collisions automatically.
 */
function registerStableId(resolvedPath: string, stableId: string): void {
  const normalizedPath = normalizePath(resolvedPath);

  if (specifierRegistry.get(normalizedPath) === stableId) {
    return;
  }

  const existingPath = stableIdToPath.get(stableId);

  if (existingPath && existingPath !== normalizedPath) {
    if (isSamePackageVersion(existingPath, normalizedPath)) {
      specifierRegistry.set(normalizedPath, stableId);
      stableIdToPath.set(stableId, normalizedPath);
      return;
    }

    console.warn(
      `[RSC] Version collision detected for "${stableId}":\n` +
        `  - ${existingPath}\n` +
        `  - ${normalizedPath}\n` +
        `  Upgrading to versioned IDs.`
    );

    const { existingNewId, newNewId } = handleCollision(existingPath, normalizedPath, stableId);

    specifierRegistry.set(existingPath, existingNewId);
    stableIdToPath.delete(stableId);
    stableIdToPath.set(existingNewId, existingPath);
    versionedIds.add(stableId);

    specifierRegistry.set(normalizedPath, newNewId);
    stableIdToPath.set(newNewId, normalizedPath);
  } else {
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

  // Case 2: Relative import - check if both origin and resolved are in packages
  // Uses package.json boundary detection instead of path heuristics
  if (originModulePath) {
    const originPkg = getPackageModuleInfo(originModulePath);
    const resolvedPkg = getPackageModuleInfo(resolvedPath);

    // Both are package modules - compute canonical specifier
    if (originPkg && resolvedPkg) {
      const relativePath = computeRelativePath(resolvedPath, resolvedPkg.root);
      const simpleId = createSimpleId(resolvedPkg.name, relativePath);

      if (versionedIds.has(simpleId)) {
        const versionedId = createVersionedId(resolvedPkg.name, resolvedPkg.version, relativePath);
        registerStableId(resolvedPath, versionedId);
      } else {
        registerStableId(resolvedPath, simpleId);
      }
      return;
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
 * Get stable ID for a module.
 *
 * Uses package.json boundaries to distinguish packages from app-level files.
 * NO path heuristics like "/node_modules/" are used.
 *
 * Priority:
 * 1. Captured specifier from registry (highest priority)
 * 2. Computed from package.json boundary (for package modules)
 * 3. Relative path from project root (for app-level files)
 */
export function getStableId(
  resolvedPath: string,
  projectRoot: string
): { stableId: string; source: 'capture' | 'computed' | 'relative' } {
  const normalizedPath = normalizePath(resolvedPath);

  // 1. Try captured specifier first (highest priority)
  const specifier = specifierRegistry.get(normalizedPath);
  if (specifier) {
    return { stableId: specifier, source: 'capture' };
  }

  // 2. Check if it's a package module (has package.json with name, NOT project root)
  const pkgInfo = getPackageModuleInfo(resolvedPath, projectRoot);
  if (pkgInfo) {
    // It's a package module - compute stable ID from package boundary
    const relativePath = computeRelativePath(resolvedPath, pkgInfo.root);
    let stableId = createSimpleId(pkgInfo.name, relativePath);

    // Check if this base ID needs versioning due to collision
    if (versionedIds.has(stableId)) {
      stableId = createVersionedId(pkgInfo.name, pkgInfo.version, relativePath);
    }

    return { stableId, source: 'computed' };
  }

  // 3. App-level file - use relative path from project root
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
 */
export function getFilePathByStableId(stableId: string): string | undefined {
  const fromResolution = stableIdToPath.get(stableId);
  if (fromResolution) {
    return fromResolution;
  }
  return discoveredClientBoundaries.get(stableId);
}

// ============================================================================
// Client Boundary Discovery Cache
// ============================================================================

const discoveredClientBoundaries = new Map<string, string>();

export function recordClientBoundary(stableId: string, filePath: string): void {
  discoveredClientBoundaries.set(stableId, filePath);
}

export function getDiscoveredClientBoundaries(): Map<string, string> {
  return new Map(discoveredClientBoundaries);
}

export function clearDiscoveredBoundaries(): void {
  discoveredClientBoundaries.clear();
}

/**
 * Export findPackageInfo for use in other modules.
 */
export { findPackageInfo };
