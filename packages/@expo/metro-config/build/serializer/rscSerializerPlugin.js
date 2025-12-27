"use strict";
/**
 * RSC Serializer Plugin
 *
 * Resolves ALL stable IDs for React Server Components.
 * Babel marks ALL boundaries with __RSC_DEFERRED__:/path/to/file.js
 * and this plugin resolves them to final stable IDs:
 * - node_modules: package specifier (e.g., "pkg/client")
 * - app-level: relative path from project root (e.g., "./src/Button.tsx")
 *
 * This centralizes all stable ID logic in one place, making it easier to
 * debug and maintain.
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
function isFileUrl(id) {
    return id.startsWith('file://');
}
function extractPathFromFileUrl(fileUrl) {
    // Convert file:///path/to/file.png to /path/to/file.png
    // Handle both Unix (file:///path) and Windows (file:///C:/path)
    const url = new URL(fileUrl);
    return normalizePath(url.pathname);
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
            // Record in global cache for client bundle to use (dev mode)
            // This allows the client bundle to include modules that are only
            // referenced from server components
            (0, rscRegistry_1.recordClientBoundary)(stableId, modulePath);
        }
        // First pass: build mappings from metadata
        for (const [modulePath, module] of graph.dependencies) {
            // Debug: log any asset files (png/jpg/etc) in the graph
            if (process.env.EXPO_DEBUG && /\.(png|jpg|jpeg|gif|webp)$/i.test(modulePath)) {
                console.log('[RSC-SERIALIZER] Asset module in graph:', modulePath);
                // Log reactClientReference for this asset
                for (const output of module.output) {
                    const data = output.data;
                    console.log('[RSC-SERIALIZER]   - reactClientReference:', data.reactClientReference || '(none)');
                }
            }
            for (const output of module.output) {
                const data = output.data;
                // Resolve deferred client references
                if (data.reactClientReference) {
                    if (isDeferredId(data.reactClientReference)) {
                        const deferredId = data.reactClientReference;
                        const resolvedPath = extractPath(deferredId);
                        const { stableId } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                        if (process.env.EXPO_DEBUG) {
                            console.log('[RSC-SERIALIZER] Resolved client ref:', deferredId, '->', stableId);
                        }
                        data.reactClientReference = stableId;
                        trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                        deferredToStableId.set(deferredId, stableId);
                    }
                    else if (isFileUrl(data.reactClientReference)) {
                        // Asset files use file:// URLs as client references
                        // Convert them to stable IDs for consistent manifest generation
                        const fileUrl = data.reactClientReference;
                        const resolvedPath = extractPathFromFileUrl(fileUrl);
                        const { stableId } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                        if (process.env.EXPO_DEBUG) {
                            console.log('[RSC-SERIALIZER] Resolved asset client ref:', fileUrl, '->', stableId);
                        }
                        data.reactClientReference = stableId;
                        trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                    }
                    else {
                        // Not a deferred ID or file URL - this shouldn't happen
                        console.warn('[RSC-SERIALIZER] Unknown client reference format:', data.reactClientReference, 'at', modulePath);
                    }
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
                // NOTE: All IDs are now deferred (from Babel), so no need to handle non-deferred IDs.
                // The Babel plugin always generates __RSC_DEFERRED__:/path/to/file.js format.
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
        //
        // In dev mode, we also need to include scanned boundaries that were added via
        // dynamic imports. These modules ARE in the graph but don't have reactClientReference
        // metadata because they were imported directly, not from a server component context.
        const RSC_BOUNDARIES_PLACEHOLDER = '__RSC_BOUNDARIES_PLACEHOLDER__';
        const BOUNDARY_IDS_MARKER = '__BOUNDARY_IDS__';
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
                // Extract __BOUNDARY_PATHS__ array from the placeholder
                // This contains absolute paths of client boundaries from server build.
                // We look these up in the graph to build module map entries.
                // Modules NOT in the graph will be handled by runtime chunk loading.
                const boundaryPathsMatch = data.code.match(/__BOUNDARY_PATHS__:\s*(\[[^\]]*\])/);
                if (boundaryPathsMatch) {
                    try {
                        const boundaryPaths = JSON.parse(boundaryPathsMatch[1]);
                        // Add boundaries to stableIdToModuleId if they exist in the graph
                        for (const boundaryPath of boundaryPaths) {
                            // Normalize the path for comparison
                            const normalizedBoundary = normalizePath(boundaryPath);
                            // Find this module in the graph by path matching
                            let foundModulePath = null;
                            for (const [graphModulePath] of graph.dependencies) {
                                const normalizedGraphPath = normalizePath(graphModulePath);
                                // Try exact match first, then suffix matching for different root paths
                                if (normalizedGraphPath === normalizedBoundary ||
                                    normalizedGraphPath.endsWith(normalizedBoundary.replace(/^.*node_modules\//, 'node_modules/')) ||
                                    normalizedBoundary.endsWith(normalizedGraphPath.replace(/^.*node_modules\//, 'node_modules/'))) {
                                    foundModulePath = graphModulePath;
                                    break;
                                }
                            }
                            if (foundModulePath) {
                                // Get stable ID for this module
                                const { stableId } = (0, rscRegistry_1.getStableId)(foundModulePath, projectRoot);
                                if (!stableIdToModuleId.has(stableId)) {
                                    const moduleId = serializerOptions.createModuleId(foundModulePath);
                                    trackStableId(stableId, foundModulePath, moduleId);
                                    if (process.env.EXPO_DEBUG) {
                                        console.log('[RSC-SERIALIZER] Added boundary from graph:', stableId, '->', moduleId);
                                    }
                                }
                            }
                            else if (process.env.EXPO_DEBUG) {
                                // Not in graph - will be handled by runtime chunk loading
                                console.log('[RSC-SERIALIZER] Boundary not in graph (will use chunk loading):', boundaryPath);
                            }
                        }
                    }
                    catch (e) {
                        console.warn('[RSC-SERIALIZER] Failed to parse __BOUNDARY_PATHS__:', e);
                    }
                }
                // Build the module map directly from stableIdToModuleId (built in first pass + scanned boundaries)
                const moduleMapEntries = [];
                for (const [stableId, moduleId] of stableIdToModuleId) {
                    // Use __r() which is Metro's require function available at runtime
                    // The () => wrapper is needed for lazy loading
                    moduleMapEntries.push(`  ${JSON.stringify(stableId)}: function() { return __r(${JSON.stringify(moduleId)}); }`);
                }
                // Build the replacement module map object
                const moduleMapCode = `{
${moduleMapEntries.join(',\n')}
}`;
                // Replace just the placeholder object in the code, keeping the __d() wrapper intact
                // The placeholder looks like: module.exports={__RSC_BOUNDARIES_PLACEHOLDER__:!0,__BOUNDARY_IDS__:[...]}
                // or: m.exports={__RSC_BOUNDARIES_PLACEHOLDER__:!0,__BOUNDARY_IDS__:[...]}
                // Dev mode uses "module", production uses "m" (minified)
                const placeholderRegex = /(module|m)\.exports\s*=\s*\{[^}]*__RSC_BOUNDARIES_PLACEHOLDER__[^}]*\}/;
                const match = data.code.match(placeholderRegex);
                if (match) {
                    // Capture which variable name is used (module or m)
                    const moduleVar = match[1];
                    // Replace the placeholder with the actual module map
                    // The function wrapper (__expoRscBoundaryLoader) is never called at runtime,
                    // it exists only to add modules to Metro's dependency graph. We keep it in
                    // the output to avoid breaking minified code, but it's dead code.
                    data.code = data.code.replace(placeholderRegex, `${moduleVar}.exports=${moduleMapCode}`);
                }
                else {
                    // Fallback: if we can't find the placeholder pattern, replace the whole code
                    // This shouldn't happen in normal operation
                    console.warn('[RSC] Warning: Could not find placeholder pattern, replacing entire module');
                    data.code = `module.exports=${moduleMapCode}`;
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