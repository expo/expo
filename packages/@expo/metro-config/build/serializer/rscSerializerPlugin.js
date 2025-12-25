"use strict";
/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRscSerializerPlugin = createRscSerializerPlugin;
exports.getRscStableIdToModuleId = getRscStableIdToModuleId;
exports.getRscStableIdToFilePath = getRscStableIdToFilePath;
const rscRegistry_1 = require("../rscRegistry");
// Must match the prefix in babel-preset-expo/src/client-module-proxy-plugin.ts
const RSC_DEFERRED_PREFIX = '__RSC_DEFERRED__:';
function isDeferredId(id) {
    return id.startsWith(RSC_DEFERRED_PREFIX);
}
function extractPath(deferredId) {
    return deferredId.slice(RSC_DEFERRED_PREFIX.length);
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
        let resolvedCount = 0;
        // Process all modules
        for (const [modulePath, module] of graph.dependencies) {
            for (const output of module.output) {
                const data = output.data;
                // Resolve deferred client references
                if (data.reactClientReference && isDeferredId(data.reactClientReference)) {
                    const resolvedPath = extractPath(data.reactClientReference);
                    const { stableId, source } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactClientReference = stableId;
                    stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
                    stableIdToFilePath.set(stableId, modulePath);
                    resolvedCount++;
                    if (debug) {
                        console.log(`[RSC] Resolved client: ${stableId} -> ${modulePath} (${source})`);
                    }
                }
                // Resolve deferred server references
                if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
                    const resolvedPath = extractPath(data.reactServerReference);
                    const { stableId, source } = (0, rscRegistry_1.getStableId)(resolvedPath, projectRoot);
                    data.reactServerReference = stableId;
                    stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
                    stableIdToFilePath.set(stableId, modulePath);
                    resolvedCount++;
                    if (debug) {
                        console.log(`[RSC] Resolved server: ${stableId} -> ${modulePath} (${source})`);
                    }
                }
                // Also capture non-deferred IDs (app-level files)
                if (data.reactClientReference && !isDeferredId(data.reactClientReference)) {
                    stableIdToModuleId.set(data.reactClientReference, serializerOptions.createModuleId(modulePath));
                    stableIdToFilePath.set(data.reactClientReference, modulePath);
                }
                if (data.reactServerReference && !isDeferredId(data.reactServerReference)) {
                    stableIdToModuleId.set(data.reactServerReference, serializerOptions.createModuleId(modulePath));
                    stableIdToFilePath.set(data.reactServerReference, modulePath);
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