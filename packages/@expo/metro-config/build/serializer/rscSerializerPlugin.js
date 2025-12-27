"use strict";
/**
 * RSC Serializer Plugin
 *
 * Collects RSC client/server boundary metadata and builds module maps.
 *
 * This plugin does:
 * 1. Collects reactClientReference/reactServerReference from module metadata
 * 2. Builds output key → module ID mapping for runtime require()
 * 3. Replaces __RSC_BOUNDARIES_PLACEHOLDER__ in virtual rsc.js module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRscSerializerPlugin = createRscSerializerPlugin;
exports.getRscOutputKeyToModuleId = getRscOutputKeyToModuleId;
exports.getRscOutputKeyToFilePath = getRscOutputKeyToFilePath;
const rscRegistry_1 = require("../rscRegistry");
/**
 * Normalize path for cross-platform consistency.
 */
function normalizePath(filePath) {
    return filePath.replace(/\\+/g, '/');
}
/**
 * Check if ID is a file:// URL (used for assets).
 */
function isFileUrl(id) {
    return id.startsWith('file://');
}
/**
 * Extract path from file:// URL.
 */
function extractPathFromFileUrl(fileUrl) {
    const url = new URL(fileUrl);
    return normalizePath(url.pathname);
}
/**
 * Serializer plugin that collects RSC metadata and builds module maps.
 */
function createRscSerializerPlugin(options) {
    const { projectRoot } = options;
    return async function rscSerializerPlugin(...props) {
        const [entryPoint, preModules, graph, serializerOptions] = props;
        // Maps output key → module ID (for runtime require())
        const outputKeyToModuleId = new Map();
        // Maps output key → file path (for chunk lookup in SSR manifest)
        const outputKeyToFilePath = new Map();
        // Helper to track output key usage
        function trackOutputKey(outputKey, modulePath, moduleId) {
            outputKeyToModuleId.set(outputKey, moduleId);
            outputKeyToFilePath.set(outputKey, modulePath);
            // Record in global cache for client bundle to use (dev mode)
            (0, rscRegistry_1.recordClientBoundary)(outputKey, modulePath);
        }
        // First pass: collect output keys from metadata and convert file:// URLs to output keys
        for (const [modulePath, module] of graph.dependencies) {
            for (const output of module.output) {
                const data = output.data;
                // Handle client references
                if (data.reactClientReference) {
                    let outputKey = data.reactClientReference;
                    // Convert file:// URLs to output keys (modifies metadata in place)
                    // This is needed for serializeChunks.ts which reads reactClientReference directly
                    if (isFileUrl(outputKey)) {
                        const resolvedPath = extractPathFromFileUrl(outputKey);
                        outputKey = (0, rscRegistry_1.getOutputKey)(resolvedPath, projectRoot).outputKey;
                        data.reactClientReference = outputKey;
                    }
                    trackOutputKey(outputKey, modulePath, serializerOptions.createModuleId(modulePath));
                    if (process.env.EXPO_DEBUG) {
                        console.log('[RSC-SERIALIZER] Client ref:', outputKey, 'at', modulePath);
                    }
                }
                // Handle server references
                if (data.reactServerReference) {
                    let outputKey = data.reactServerReference;
                    // Convert file:// URLs to output keys (modifies metadata in place)
                    // This is needed for serializeChunks.ts which reads reactServerReference directly
                    if (isFileUrl(outputKey)) {
                        const resolvedPath = extractPathFromFileUrl(outputKey);
                        outputKey = (0, rscRegistry_1.getOutputKey)(resolvedPath, projectRoot).outputKey;
                        data.reactServerReference = outputKey;
                    }
                    trackOutputKey(outputKey, modulePath, serializerOptions.createModuleId(modulePath));
                    if (process.env.EXPO_DEBUG) {
                        console.log('[RSC-SERIALIZER] Server ref:', outputKey, 'at', modulePath);
                    }
                }
            }
        }
        // Second pass: replace __RSC_BOUNDARIES_PLACEHOLDER__ in virtual rsc.js module
        const RSC_BOUNDARIES_PLACEHOLDER = '__RSC_BOUNDARIES_PLACEHOLDER__';
        for (const [modulePath, module] of graph.dependencies) {
            if (!modulePath.includes('expo/virtual/rsc.js')) {
                continue;
            }
            for (const output of module.output) {
                const data = output.data;
                if (!data.code || !data.code.includes(RSC_BOUNDARIES_PLACEHOLDER)) {
                    continue;
                }
                // Extract __BOUNDARY_PATHS__ array from the placeholder
                const boundaryPathsMatch = data.code.match(/__BOUNDARY_PATHS__:\s*(\[[^\]]*\])/);
                if (boundaryPathsMatch) {
                    try {
                        const boundaryPaths = JSON.parse(boundaryPathsMatch[1]);
                        // Add boundaries to outputKeyToModuleId if they exist in the graph
                        for (const boundaryPath of boundaryPaths) {
                            const normalizedBoundary = normalizePath(boundaryPath);
                            // Find this module in the graph
                            let foundModulePath = null;
                            for (const [graphModulePath] of graph.dependencies) {
                                const normalizedGraphPath = normalizePath(graphModulePath);
                                if (normalizedGraphPath === normalizedBoundary ||
                                    normalizedGraphPath.endsWith(normalizedBoundary.replace(/^.*node_modules\//, 'node_modules/')) ||
                                    normalizedBoundary.endsWith(normalizedGraphPath.replace(/^.*node_modules\//, 'node_modules/'))) {
                                    foundModulePath = graphModulePath;
                                    break;
                                }
                            }
                            if (foundModulePath) {
                                const { outputKey } = (0, rscRegistry_1.getOutputKey)(foundModulePath, projectRoot);
                                if (!outputKeyToModuleId.has(outputKey)) {
                                    const moduleId = serializerOptions.createModuleId(foundModulePath);
                                    trackOutputKey(outputKey, foundModulePath, moduleId);
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.warn('[RSC-SERIALIZER] Failed to parse __BOUNDARY_PATHS__:', e);
                    }
                }
                // Build the module map
                const moduleMapEntries = [];
                for (const [outputKey, moduleId] of outputKeyToModuleId) {
                    moduleMapEntries.push(`  ${JSON.stringify(outputKey)}: function() { return __r(${JSON.stringify(moduleId)}); }`);
                }
                const moduleMapCode = `{\n${moduleMapEntries.join(',\n')}\n}`;
                // Replace placeholder with actual module map
                const placeholderRegex = /(module|m)\.exports\s*=\s*\{[^}]*__RSC_BOUNDARIES_PLACEHOLDER__[^}]*\}/;
                const match = data.code.match(placeholderRegex);
                if (match) {
                    const moduleVar = match[1];
                    data.code = data.code.replace(placeholderRegex, `${moduleVar}.exports=${moduleMapCode}`);
                }
                else {
                    console.warn('[RSC] Warning: Could not find placeholder pattern');
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
        graph.transformOptions.customTransformOptions.__rscOutputKeyToModuleId =
            Object.fromEntries(outputKeyToModuleId);
        graph.transformOptions.customTransformOptions.__rscOutputKeyToFilePath =
            Object.fromEntries(outputKeyToFilePath);
        return [entryPoint, preModules, graph, serializerOptions];
    };
}
/**
 * Get RSC output key → module ID mapping from graph.
 */
function getRscOutputKeyToModuleId(graph) {
    return graph.transformOptions?.customTransformOptions?.__rscOutputKeyToModuleId ?? {};
}
/**
 * Get RSC output key → file path mapping from graph.
 */
function getRscOutputKeyToFilePath(graph) {
    return graph.transformOptions?.customTransformOptions?.__rscOutputKeyToFilePath ?? {};
}
//# sourceMappingURL=rscSerializerPlugin.js.map