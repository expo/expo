"use strict";
/**
 * RSC Specifier Registry
 *
 * Simple Map that captures import specifiers during Metro resolution.
 * Used to generate stable IDs for React Server Components.
 *
 * Key insight: We only need to capture bare specifiers (package imports).
 * App-level files use relative paths which are already stable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureSpecifier = captureSpecifier;
exports.getSpecifier = getSpecifier;
exports.clearRegistry = clearRegistry;
exports.isNodeModulePath = isNodeModulePath;
exports.getStableId = getStableId;
exports.debugRegistry = debugRegistry;
// Global registry: resolvedPath -> specifier
// Key: absolute file path, normalized to forward slashes (e.g., "/path/to/node_modules/pkg/client.js")
// Value: import specifier (e.g., "pkg/client")
const specifierRegistry = new Map();
/**
 * Normalize path for cross-platform consistency.
 * Converts backslashes to forward slashes for Windows compatibility.
 * Handles escaped backslashes (\\) from JS string literals.
 */
function normalizePath(filePath) {
    // Replace one or more consecutive backslashes with a single forward slash
    return filePath.replace(/\\+/g, '/');
}
/**
 * Record a resolution: maps resolved file path to its import specifier.
 */
function captureSpecifier(resolvedPath, specifier) {
    // Only capture bare specifiers (not relative imports)
    // Relative imports like "./foo" are already stable IDs
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        // Normalize path for consistent lookup across platforms
        specifierRegistry.set(normalizePath(resolvedPath), specifier);
    }
}
/**
 * Get the captured specifier for a resolved path.
 */
function getSpecifier(resolvedPath) {
    return specifierRegistry.get(normalizePath(resolvedPath));
}
/**
 * Clear the registry (for watch mode rebuilds).
 */
function clearRegistry() {
    specifierRegistry.clear();
}
/**
 * Check if a path is inside node_modules.
 */
function isNodeModulePath(filePath) {
    return filePath.includes('/node_modules/') || filePath.includes('\\node_modules\\');
}
/**
 * Get stable ID for a module.
 *
 * For node_modules: use captured specifier or fallback to relative path
 * For app-level: use relative path from project root
 */
function getStableId(resolvedPath, projectRoot) {
    // Normalize path for consistent lookup
    const normalizedPath = normalizePath(resolvedPath);
    // Try captured specifier first
    const specifier = specifierRegistry.get(normalizedPath);
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
function debugRegistry() {
    console.log('\n=== RSC Specifier Registry ===');
    console.log(`Total entries: ${specifierRegistry.size}`);
    for (const [path, specifier] of specifierRegistry) {
        console.log(`  ${specifier} -> ${path.slice(-60)}`);
    }
    console.log('==============================\n');
}
//# sourceMappingURL=rscRegistry.js.map