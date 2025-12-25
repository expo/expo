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
    const { projectRoot, debug = false } = options;
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
        let resolvedCount = 0;
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
                if (debug) {
                    console.warn(`[RSC] Warning: Stable ID collision detected for "${stableId}":\n` +
                        `  Previous: ${existingPath}\n` +
                        `  Current:  ${modulePath}\n` +
                        `  The last occurrence will be used. This may cause issues with pnpm or aliased packages.`);
                }
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
                    const { stableId, source } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactClientReference = stableId;
                    trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                    deferredToStableId.set(deferredId, stableId);
                    resolvedCount++;
                    if (debug) {
                        console.log(`[RSC] Resolved client: ${stableId} -> ${modulePath} (${source})`);
                    }
                }
                // Resolve deferred server references
                if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
                    const deferredId = data.reactServerReference;
                    const resolvedPath = extractPath(deferredId);
                    const { stableId, source } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactServerReference = stableId;
                    trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
                    deferredToStableId.set(deferredId, stableId);
                    resolvedCount++;
                    if (debug) {
                        console.log(`[RSC] Resolved server: ${stableId} -> ${modulePath} (${source})`);
                    }
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
        if (debug && resolvedCount > 0) {
            console.log(`[RSC] Resolved ${resolvedCount} deferred stable IDs`);
        }
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
        // Clear registry after serialization to prevent stale entries in watch mode
        (0, rscRegistry_1.clearRegistry)();
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