"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.createDefaultExportCustomSerializer = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const jsc_safe_url_1 = require("jsc-safe-url");
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const debugId_1 = require("./debugId");
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const baseJSBundle_1 = require("./fork/baseJSBundle");
const reconcileTransformSerializerPlugin_1 = require("./reconcileTransformSerializerPlugin");
const serializeChunks_1 = require("./serializeChunks");
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
const env_1 = require("../env");
const sourceMapString = typeof sourceMapString_1.default !== 'function'
    ? sourceMapString_1.default.sourceMapString
    : sourceMapString_1.default;
function withExpoSerializers(config, options = {}) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    // Then tree-shake the modules.
    processors.push(treeShakeSerializerPlugin_1.treeShakeSerializer);
    // Then finish transforming the modules from AST to JS.
    processors.push(reconcileTransformSerializerPlugin_1.reconcileTransformSerializerPlugin);
    return withSerializerPlugins(config, processors, options);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors, options = {}) {
    const originalSerializer = config.serializer?.customSerializer;
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(config, processors, originalSerializer ?? null, options),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
function createDefaultExportCustomSerializer(config, configOptions = {}) {
    return async (entryPoint, preModules, graph, inputOptions) => {
        const isPossiblyDev = graph.transformOptions.hot;
        // TODO: This is a temporary solution until we've converged on using the new serializer everywhere.
        const enableDebugId = inputOptions.inlineSourceMap !== true && !isPossiblyDev;
        const context = {
            platform: graph.transformOptions?.platform,
            environment: graph.transformOptions?.customTransformOptions?.environment ?? 'client',
        };
        const options = {
            ...inputOptions,
            createModuleId: (moduleId, ...props) => {
                if (props.length > 0) {
                    return inputOptions.createModuleId(moduleId, ...props);
                }
                return inputOptions.createModuleId(moduleId, 
                // @ts-expect-error: context is added by Expo and not part of the upstream Metro implementation.
                context);
            },
        };
        let debugId;
        const loadDebugId = () => {
            if (!enableDebugId || debugId) {
                return debugId;
            }
            // TODO: Perform this cheaper.
            const bundle = (0, baseJSBundle_1.baseJSBundle)(entryPoint, preModules, graph, {
                ...options,
                debugId: undefined,
            });
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            debugId = (0, debugId_1.stringToUUID)(outputCode);
            return debugId;
        };
        let premodulesToBundle = [...preModules];
        let bundleCode = null;
        let bundleMap = null;
        if (config.serializer?.customSerializer) {
            const bundle = await config.serializer?.customSerializer(entryPoint, premodulesToBundle, graph, options);
            if (typeof bundle === 'string') {
                bundleCode = bundle;
            }
            else {
                bundleCode = bundle.code;
                bundleMap = bundle.map;
            }
        }
        else {
            const debugId = loadDebugId();
            if (configOptions.unstable_beforeAssetSerializationPlugins) {
                for (const plugin of configOptions.unstable_beforeAssetSerializationPlugins) {
                    premodulesToBundle = plugin({ graph, premodules: [...premodulesToBundle], debugId });
                }
            }
            bundleCode = (0, bundleToString_1.default)((0, baseJSBundle_1.baseJSBundle)(entryPoint, premodulesToBundle, graph, {
                ...options,
                debugId,
            })).code;
        }
        const getEnsuredMaps = () => {
            bundleMap ??= sourceMapString([...premodulesToBundle, ...(0, serializeChunks_1.getSortedModules)([...graph.dependencies.values()], options)], {
                // TODO: Surface this somehow.
                excludeSource: false,
                // excludeSource: options.serializerOptions?.excludeSource,
                processModuleFilter: options.processModuleFilter,
                shouldAddToIgnoreList: options.shouldAddToIgnoreList,
            });
            return bundleMap;
        };
        if (!bundleMap && options.sourceUrl) {
            const url = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
                ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
                : options.sourceUrl;
            const parsed = new URL(url, 'http://expo.dev');
            // Is dev server request for source maps...
            if (parsed.pathname.endsWith('.map')) {
                return {
                    code: bundleCode,
                    map: getEnsuredMaps(),
                };
            }
        }
        if (isPossiblyDev) {
            if (bundleMap == null) {
                return bundleCode;
            }
            return {
                code: bundleCode,
                map: bundleMap,
            };
        }
        // Exports....
        bundleMap ??= getEnsuredMaps();
        if (enableDebugId) {
            const mutateSourceMapWithDebugId = (sourceMap) => {
                // NOTE: debugId isn't required for inline source maps because the source map is included in the same file, therefore
                // we don't need to disambiguate between multiple source maps.
                const sourceMapObject = JSON.parse(sourceMap);
                sourceMapObject.debugId = loadDebugId();
                // NOTE: Sentry does this, but bun does not.
                // sourceMapObject.debug_id = debugId;
                return JSON.stringify(sourceMapObject);
            };
            return {
                code: bundleCode,
                map: mutateSourceMapWithDebugId(bundleMap),
            };
        }
        return {
            code: bundleCode,
            map: bundleMap,
        };
    };
}
exports.createDefaultExportCustomSerializer = createDefaultExportCustomSerializer;
function getDefaultSerializer(config, fallbackSerializer, configOptions = {}) {
    const defaultSerializer = fallbackSerializer ?? createDefaultExportCustomSerializer(config, configOptions);
    return async (entryPoint, preModules, graph, inputOptions) => {
        const context = {
            platform: graph.transformOptions?.platform,
            environment: graph.transformOptions?.customTransformOptions?.environment ?? 'client',
        };
        const options = {
            ...inputOptions,
            createModuleId: (moduleId, ...props) => {
                if (props.length > 0) {
                    return inputOptions.createModuleId(moduleId, ...props);
                }
                return inputOptions.createModuleId(moduleId, 
                // @ts-expect-error: context is added by Expo and not part of the upstream Metro implementation.
                context);
            },
        };
        const customSerializerOptions = inputOptions.serializerOptions;
        // Custom options can only be passed outside of the dev server, meaning
        // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
        const supportsNonSerialReturn = !!customSerializerOptions?.output;
        const serializerOptions = (() => {
            if (customSerializerOptions) {
                return {
                    outputMode: customSerializerOptions.output,
                    splitChunks: customSerializerOptions.splitChunks,
                    usedExports: customSerializerOptions.usedExports,
                    includeSourceMaps: customSerializerOptions.includeSourceMaps,
                };
            }
            if (options.sourceUrl) {
                const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
                    ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
                    : options.sourceUrl;
                const url = new URL(sourceUrl, 'https://expo.dev');
                return {
                    outputMode: url.searchParams.get('serializer.output'),
                    usedExports: url.searchParams.get('serializer.usedExports') === 'true',
                    splitChunks: url.searchParams.get('serializer.splitChunks') === 'true',
                    includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
                };
            }
            return null;
        })();
        if (serializerOptions?.outputMode !== 'static') {
            return defaultSerializer(entryPoint, preModules, graph, options);
        }
        // Mutate the serializer options with the parsed options.
        options.serializerOptions = {
            ...options.serializerOptions,
            ...serializerOptions,
        };
        const assets = await (0, serializeChunks_1.graphToSerialAssetsAsync)(config, {
            includeSourceMaps: !!serializerOptions.includeSourceMaps,
            splitChunks: !!serializerOptions.splitChunks,
            ...configOptions,
        }, entryPoint, preModules, graph, options);
        if (supportsNonSerialReturn) {
            // @ts-expect-error: this is future proofing for adding assets to the output as well.
            return assets;
        }
        return JSON.stringify(assets);
    };
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer, options = {}) {
    const finalSerializer = getDefaultSerializer(config, originalSerializer, options);
    return async (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = await processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
//# sourceMappingURL=withExpoSerializers.js.map