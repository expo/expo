"use strict";
/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 *
 * This plugin does TWO things:
 * 1. Updates metadata (reactClientReference/reactServerReference)
 * 2. Rewrites the actual JS code to replace deferred IDs with stable IDs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRscSerializerPlugin = createRscSerializerPlugin;
exports.getRscStableIdToModuleId = getRscStableIdToModuleId;
exports.getRscStableIdToFilePath = getRscStableIdToFilePath;
const rscRegistry_1 = require("../rscRegistry");
// Must match the prefix in babel-preset-expo/src/client-module-proxy-plugin.ts
const RSC_DEFERRED_PREFIX = '__RSC_DEFERRED__:';
/**
 * Normalize path for cross-platform consistency.
 * - Converts backslashes to forward slashes
 * - Handles escaped backslashes from JS string literals (\\)
 */
function normalizePath(filePath) {
    // Handle escaped backslashes in JS strings (e.g., "C:\\Users\\...")
    // and regular backslashes (e.g., "C:\Users\...")
    return filePath.replace(/\\+/g, '/');
}
function isDeferredId(id) {
    return id.startsWith(RSC_DEFERRED_PREFIX);
}
function extractPath(deferredId) {
    const rawPath = deferredId.slice(RSC_DEFERRED_PREFIX.length);
    return normalizePath(rawPath);
}
/**
 * Create a regex to match deferred IDs in code.
 * Matches: "__RSC_DEFERRED__:/path/to/file.js" (with quotes)
 */
function createDeferredIdRegex() {
    // Match the deferred prefix followed by any path, inside quotes
    // Handles both single and double quotes
    return new RegExp(`(["'])${RSC_DEFERRED_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^"']+)\\1`, 'g');
}
/**
 * Serializer plugin that resolves deferred RSC stable IDs.
 */
function createRscSerializerPlugin(options) {
    const { projectRoot } = options;
    return async function rscSerializerPlugin(...props) {
        const [entryPoint, preModules, graph, serializerOptions] = props;
        // Maps stable ID → module ID (for runtime require())
        const stableIdToModuleId = new Map();
        // Maps stable ID → file path (for chunk lookup in SSR manifest)
        const stableIdToFilePath = new Map();
        // Maps deferred ID → stable ID (for code rewriting)
        const deferredToStableId = new Map();
        // Track collisions: stable ID → list of file paths that resolve to it
        const stableIdCollisions = new Map();
        // Helper to track stable ID usage and detect collisions
        function trackStableId(stableId, modulePath, moduleId) {
            const existingPath = stableIdToFilePath.get(stableId);
            if (existingPath && existingPath !== modulePath) {
                // Collision detected: same stable ID maps to different files
                const collisions = stableIdCollisions.get(stableId) ?? [existingPath];
                if (!collisions.includes(modulePath)) {
                    collisions.push(modulePath);
                }
                stableIdCollisions.set(stableId, collisions);
            }
            stableIdToModuleId.set(stableId, moduleId);
            stableIdToFilePath.set(stableId, modulePath);
        }
        // First pass: build mappings from metadata
        for (const [modulePath, module] of graph.dependencies) {
            for (const output of module.output) {
                const data = output.data;
                // Resolve deferred client references
                if (data.reactClientReference && isDeferredId(data.reactClientReference)) {
                    const deferredId = data.reactClientReference;
                    const resolvedPath = extractPath(deferredId);
                    const { stableId } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactClientReference = stableId;
                    trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                    deferredToStableId.set(deferredId, stableId);
                }
                // Resolve deferred server references
                if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
                    const deferredId = data.reactServerReference;
                    const resolvedPath = extractPath(deferredId);
                    const { stableId } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactServerReference = stableId;
                    trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                    deferredToStableId.set(deferredId, stableId);
                }
                // Also capture non-deferred IDs (app-level files)
                if (data.reactClientReference && !isDeferredId(data.reactClientReference)) {
                    trackStableId(data.reactClientReference, modulePath, serializerOptions.createModuleId(modulePath));
                }
                if (data.reactServerReference && !isDeferredId(data.reactServerReference)) {
                    trackStableId(data.reactServerReference, modulePath, serializerOptions.createModuleId(modulePath));
                }
            }
        }
        // Second pass: rewrite code to replace deferred IDs with stable IDs
        // Note: We don't recalculate source maps here because:
        // 1. RSC boundary modules are entirely replaced with proxies (original source not meaningful)
        // 2. The string length change is minimal (deferred ID → specifier)
        // 3. Debugging proxy modules is rare
        if (deferredToStableId.size > 0) {
            const deferredIdRegex = createDeferredIdRegex();
            for (const [, module] of graph.dependencies) {
                for (const output of module.output) {
                    const data = output.data;
                    if (data.code && data.code.includes(RSC_DEFERRED_PREFIX)) {
                        data.code = data.code.replace(deferredIdRegex, (match, quote, rawPath) => {
                            // Normalize path for Windows compatibility (handles escaped backslashes)
                            const normalizedPath = normalizePath(rawPath);
                            const deferredId = RSC_DEFERRED_PREFIX + normalizedPath;
                            const stableId = deferredToStableId.get(deferredId);
                            if (stableId) {
                                return `${quote}${stableId}${quote}`;
                            }
                            // Fallback: resolve directly if not in map
                            const { stableId: fallbackId } = (0, rscRegistry_1.getStableId)(normalizedPath, projectRoot);
                            return `${quote}${fallbackId}${quote}`;
                        });
                    }
                }
            }
        }
        // Third pass: replace __RSC_BOUNDARIES_PLACEHOLDER__ with actual module map
        // This handles the virtual rsc.js module that contains client boundary references
        const RSC_BOUNDARIES_PLACEHOLDER = '__RSC_BOUNDARIES_PLACEHOLDER__';
        for (const [modulePath, module] of graph.dependencies) {
            // Only process the virtual rsc.js module
            if (!modulePath.includes('expo/virtual/rsc.js')) {
                continue;
            }
            for (const output of module.output) {
                const data = output.data;
                if (!data.code) {
                    continue;
                }
                if (!data.code.includes(RSC_BOUNDARIES_PLACEHOLDER)) {
                    continue;
                }
                // Extract the boundary IDs from the placeholder code
                const boundaryIdsMatch = data.code.match(/__BOUNDARY_IDS__:\s*(\[[\s\S]*?\])/);
                if (!boundaryIdsMatch) {
                    continue;
                }
                let boundaryFilePaths;
                try {
                    boundaryFilePaths = JSON.parse(boundaryIdsMatch[1]);
                }
                catch (e) {
                    console.warn('[RSC] Failed to parse __BOUNDARY_IDS__:', e);
                    continue;
                }
                // Build specifier -> absolutePath mapping from module's dependencies
                // This is needed because package specifiers (e.g., "react-native-web/dist/exports/View")
                // are not directly in the graph - we need their resolved paths
                const specifierToAbsolutePath = new Map();
                for (const dep of module.dependencies.values()) {
                    if ('absolutePath' in dep && dep.absolutePath) {
                        // The specifier used in require() is in dep.data.name
                        const specifier = dep.data?.name;
                        if (specifier) {
                            specifierToAbsolutePath.set(specifier, dep.absolutePath);
                        }
                    }
                }
                // Build the module map using direct graph lookup
                // In client bundle, RSC metadata isn't present, so we look up directly
                // Format: { [stableId]: () => __r(moduleId) }
                const path = require('path');
                const moduleMapEntries = boundaryFilePaths
                    .map((stableIdPath) => {
                    let absolutePath;
                    if (stableIdPath.startsWith('./')) {
                        // Relative paths: resolve from project root
                        absolutePath = path.resolve(projectRoot, stableIdPath);
                    }
                    else if (path.isAbsolute(stableIdPath)) {
                        // Already absolute path
                        absolutePath = stableIdPath;
                    }
                    else {
                        // Package specifier: look up in the dependencies mapping
                        const resolvedPath = specifierToAbsolutePath.get(stableIdPath);
                        if (!resolvedPath) {
                            return null;
                        }
                        absolutePath = resolvedPath;
                    }
                    // Check if module exists in graph (direct lookup with absolute path)
                    if (!graph.dependencies.has(absolutePath)) {
                        return null;
                    }
                    // Use the original stable ID as the key in the module map
                    // This must match what the server uses in createClientModuleProxy
                    // For relative paths (./...), keep them as-is
                    // For package specifiers, keep them as-is (they are already stable IDs)
                    const stableId = stableIdPath;
                    // Get module ID directly from serializerOptions
                    const moduleId = serializerOptions.createModuleId(absolutePath);
                    // Use __r() which is Metro's require function available at runtime
                    // The () => wrapper is needed for lazy loading
                    return `  ${JSON.stringify(stableId)}: function() { return __r(${JSON.stringify(moduleId)}); }`;
                })
                    .filter(Boolean);
                // Build the replacement module map object
                const moduleMapCode = `{
${moduleMapEntries.join(',\n')}
}`;
                // Replace just the placeholder object in the code, keeping the __d() wrapper intact
                // The placeholder looks like: module.exports={__RSC_BOUNDARIES_PLACEHOLDER__:!0,__BOUNDARY_IDS__:[...]}
                // or: m.exports={__RSC_BOUNDARIES_PLACEHOLDER__:!0,__BOUNDARY_IDS__:[...]}
                const placeholderRegex = /(?:module|m)\.exports\s*=\s*\{[^}]*__RSC_BOUNDARIES_PLACEHOLDER__[^}]*\}/;
                if (placeholderRegex.test(data.code)) {
                    // First, remove the require statements that were added to force boundaries into the graph
                    // These are added by transform-worker to get boundaries into the dependency graph.
                    // By the time serializer runs, Metro has already transformed them to:
                    //   r(d[0]),r(d[1]),r(d[2]),...;  (minified require calls)
                    // We need to remove them because they execute immediately at module init,
                    // causing loading order issues with circular dependencies.
                    // Match: sequence of r(d[N]) calls followed by semicolon, before the placeholder
                    const requireStatementsRegex = /(?:r\(d\[\d+\]\),?\s*)+;?(?=(?:module|m)\.exports)/g;
                    data.code = data.code.replace(requireStatementsRegex, '');
                    // Then replace the placeholder with the actual module map
                    // Use m.exports since Metro's minified code uses the shortened parameter name
                    data.code = data.code.replace(placeholderRegex, `m.exports=${moduleMapCode}`);
                }
                else {
                    // Fallback: if we can't find the placeholder pattern, replace the whole code
                    // This shouldn't happen in normal operation
                    console.warn('[RSC] Warning: Could not find placeholder pattern, replacing entire module');
                    data.code = `m.exports=${moduleMapCode}`;
                }
            }
        }
        // Store mappings for SSR manifest
        if (!graph.transformOptions) {
            graph.transformOptions = {};
        }
        if (!graph.transformOptions.customTransformOptions) {
            graph.transformOptions.customTransformOptions = {};
        }
        graph.transformOptions.customTransformOptions.__rscStableIdToModuleId =
            Object.fromEntries(stableIdToModuleId);
        graph.transformOptions.customTransformOptions.__rscStableIdToFilePath =
            Object.fromEntries(stableIdToFilePath);
        // Warn about stable ID collisions (even without debug flag)
        if (stableIdCollisions.size > 0) {
            const collisionSummary = Array.from(stableIdCollisions.entries())
                .map(([stableId, paths]) => `  "${stableId}":\n${paths.map((p) => `    - ${p}`).join('\n')}`)
                .join('\n');
            console.warn(`[RSC] Warning: ${stableIdCollisions.size} stable ID collision(s) detected.\n` +
                `This can happen with pnpm, multiple package versions, or aliased imports.\n` +
                `The last occurrence of each will be used, which may cause incorrect module resolution:\n` +
                collisionSummary);
        }
        // NOTE: Don't clear registry here - it's needed by subsequent bundles (like modulesOnly bundles)
        // during export. The registry will be cleared on next full rebuild.
        // clearRegistry();
        return [entryPoint, preModules, graph, serializerOptions];
    };
}
/**
 * Get RSC stable ID → module ID mapping from graph.
 */
function getRscStableIdToModuleId(graph) {
    return graph.transformOptions?.customTransformOptions?.__rscStableIdToModuleId ?? {};
}
/**
 * Get RSC stable ID → file path mapping from graph.
 * Used for SSR manifest chunk lookup.
 */
function getRscStableIdToFilePath(graph) {
    return graph.transformOptions?.customTransformOptions?.__rscStableIdToFilePath ?? {};
}
//# sourceMappingURL=rscSerializerPlugin.js.map