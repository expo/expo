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

// Cache for exports reverse lookup: packageRoot → Map<filePath, specifier>
const exportsReverseCache = new Map<string, Map<string, string>>();

// Project root for distinguishing app-level files from packages
let cachedProjectRoot: string | null = null;

interface PackageInfo {
  name: string;
  version: string;
  root: string;
}

// ============================================================================
// Exports Field Reverse Lookup
// ============================================================================

type ExportsValue = string | null | { [key: string]: ExportsValue };

/**
 * Build a reverse lookup map from package.json exports field.
 * Maps resolved file paths back to their export specifiers.
 *
 * Example:
 *   exports: { "./client": "./dist/client/index.js" }
 *   Result: Map { "/abs/path/dist/client/index.js" => "pkg/client" }
 */
function buildExportsReverseMap(packageRoot: string, packageName: string): Map<string, string> {
  const cached = exportsReverseCache.get(packageRoot);
  if (cached) {
    return cached;
  }

  const reverseMap = new Map<string, string>();
  const pkgJsonPath = path.join(packageRoot, 'package.json');

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    // Process exports field
    if (pkg.exports) {
      processExportsField(pkg.exports, packageRoot, packageName, '.', reverseMap);
    }

    // Also handle main/module fields as fallback for packages without exports
    if (!pkg.exports) {
      if (pkg.main) {
        const mainPath = resolveExportPath(packageRoot, pkg.main);
        if (mainPath && !reverseMap.has(mainPath)) {
          reverseMap.set(mainPath, packageName);
        }
      }
      if (pkg.module) {
        const modulePath = resolveExportPath(packageRoot, pkg.module);
        if (modulePath && !reverseMap.has(modulePath)) {
          reverseMap.set(modulePath, packageName);
        }
      }
    }
  } catch {
    // Ignore errors (missing package.json, parse errors, etc.)
  }

  exportsReverseCache.set(packageRoot, reverseMap);
  return reverseMap;
}

/**
 * Resolve an export path to an absolute normalized path.
 */
function resolveExportPath(packageRoot: string, exportPath: string): string | null {
  if (typeof exportPath !== 'string') {
    return null;
  }
  // Remove leading ./ if present
  const cleanPath = exportPath.startsWith('./') ? exportPath.slice(2) : exportPath;
  const absolutePath = path.join(packageRoot, cleanPath);
  return normalizePath(absolutePath);
}

/**
 * Process exports field recursively.
 * Handles:
 * - String values: "./dist/index.js"
 * - Subpath exports: { "./client": "./dist/client.js" }
 * - Conditional exports: { "import": "./esm/index.js", "require": "./cjs/index.js" }
 * - Nested conditions: { "./client": { "import": "./esm/client.js" } }
 * - Wildcard patterns: { "./*": "./dist/*.js" }
 */
function processExportsField(
  exports: ExportsValue,
  packageRoot: string,
  packageName: string,
  currentSubpath: string,
  reverseMap: Map<string, string>
): void {
  if (exports === null) {
    return;
  }

  if (typeof exports === 'string') {
    // Direct string mapping
    const filePath = resolveExportPath(packageRoot, exports);
    if (filePath) {
      // Convert subpath to specifier: "." → "pkg", "./client" → "pkg/client"
      const specifier = subpathToSpecifier(packageName, currentSubpath);

      // Only add if not already mapped (prefer shorter/earlier specifiers)
      if (!reverseMap.has(filePath)) {
        reverseMap.set(filePath, specifier);
      }

      // Also add without extension for flexible matching
      const withoutExt = filePath.replace(/\.(js|mjs|cjs|jsx|ts|tsx)$/, '');
      if (withoutExt !== filePath && !reverseMap.has(withoutExt)) {
        reverseMap.set(withoutExt, specifier);
      }

      // Also add with /index removed
      const withoutIndex = withoutExt.replace(/\/index$/, '');
      if (withoutIndex !== withoutExt && !reverseMap.has(withoutIndex)) {
        reverseMap.set(withoutIndex, specifier);
      }
    }
    return;
  }

  if (typeof exports === 'object') {
    for (const [key, value] of Object.entries(exports)) {
      if (key.startsWith('.')) {
        // Subpath export: "./foo", "./bar/*"
        if (key.includes('*')) {
          // Wildcard pattern - skip for now (too complex to reverse-map)
          // TODO: Could implement pattern matching if needed
          continue;
        }
        processExportsField(value, packageRoot, packageName, key, reverseMap);
      } else {
        // Conditional export: "import", "require", "default", "node", "browser", etc.
        // Process all conditions to capture all possible mappings
        processExportsField(value, packageRoot, packageName, currentSubpath, reverseMap);
      }
    }
  }
}

/**
 * Convert a subpath to a full specifier.
 * "." → "pkg"
 * "./client" → "pkg/client"
 * "./lib/utils" → "pkg/lib/utils"
 */
function subpathToSpecifier(packageName: string, subpath: string): string {
  if (subpath === '.') {
    return packageName;
  }
  // Remove leading "./" and join with package name
  const cleanSubpath = subpath.startsWith('./') ? subpath.slice(2) : subpath.slice(1);
  return `${packageName}/${cleanSubpath}`;
}

/**
 * Look up a specifier from exports reverse map.
 * Returns the export specifier if found, null otherwise.
 */
function getSpecifierFromExports(
  filePath: string,
  packageRoot: string,
  packageName: string
): string | null {
  const reverseMap = buildExportsReverseMap(packageRoot, packageName);
  const normalizedPath = normalizePath(filePath);

  // Try exact match
  let specifier = reverseMap.get(normalizedPath);
  if (specifier) {
    return specifier;
  }

  // Try without extension
  const withoutExt = normalizedPath.replace(/\.(js|mjs|cjs|jsx|ts|tsx)$/, '');
  specifier = reverseMap.get(withoutExt);
  if (specifier) {
    return specifier;
  }

  // Try without /index
  const withoutIndex = withoutExt.replace(/\/index$/, '');
  specifier = reverseMap.get(withoutIndex);
  if (specifier) {
    return specifier;
  }

  return null;
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
  exportsReverseCache.clear();
}

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
export function getStableId(
  resolvedPath: string,
  projectRoot: string
): { stableId: string; source: 'capture' | 'exports' | 'computed' | 'relative' } {
  const normalizedPath = normalizePath(resolvedPath);

  // 1. Try captured specifier first (highest priority)
  // This is the actual import specifier used in code
  const specifier = specifierRegistry.get(normalizedPath);
  if (specifier) {
    return { stableId: specifier, source: 'capture' };
  }

  // 2. Check if it's a package module (has package.json with name, NOT project root)
  const pkgInfo = getPackageModuleInfo(resolvedPath, projectRoot);
  if (pkgInfo) {
    // 2a. Try exports field reverse lookup first
    // This gives us the "public" specifier like "pkg/client" instead of "pkg/dist/client/index.js"
    const exportsSpecifier = getSpecifierFromExports(resolvedPath, pkgInfo.root, pkgInfo.name);
    if (exportsSpecifier) {
      // Check if this ID needs versioning due to collision
      if (versionedIds.has(exportsSpecifier)) {
        const versionedId = `${exportsSpecifier}@${pkgInfo.version}`;
        return { stableId: versionedId, source: 'exports' };
      }
      return { stableId: exportsSpecifier, source: 'exports' };
    }

    // 2b. Fall back to computed from package boundary
    // This is for packages that don't have exports field or files not in exports
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
