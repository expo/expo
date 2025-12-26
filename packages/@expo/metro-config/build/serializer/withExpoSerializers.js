"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withExpoSerializers = withExpoSerializers;
exports.withSerializerPlugins = withSerializerPlugins;
exports.createDefaultExportCustomSerializer = createDefaultExportCustomSerializer;
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
const sourceMapString_1 = require("@expo/metro/metro/DeltaBundler/Serializers/sourceMapString");
const bundleToString_1 = __importDefault(require("@expo/metro/metro/lib/bundleToString"));
const jsc_safe_url_1 = require("jsc-safe-url");
const debugId_1 = require("./debugId");
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const baseJSBundle_1 = require("./fork/baseJSBundle");
const reconcileTransformSerializerPlugin_1 = require("./reconcileTransformSerializerPlugin");
const rscSerializerPlugin_1 = require("./rscSerializerPlugin");
const serializeChunks_1 = require("./serializeChunks");
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
const env_1 = require("../env");
function withExpoSerializers(config, options = {}) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    // Then tree-shake the modules.
    processors.push(treeShakeSerializerPlugin_1.treeShakeSerializer);
    // Then finish transforming the modules from AST to JS.
    // This must run before RSC plugin since reconcile regenerates code from AST
    // and would overwrite any code changes made by RSC plugin.
    processors.push(reconcileTransformSerializerPlugin_1.reconcileTransformSerializerPlugin);
    // Resolve RSC deferred stable IDs AFTER reconcile has generated final code.
    // The Babel transform sets metadata with deferred IDs, and this plugin:
    // 1. Resolves deferred IDs to stable IDs in metadata
    // 2. Rewrites the actual JS code to replace deferred ID strings
    if (options.projectRoot) {
        processors.push((0, rscSerializerPlugin_1.createRscSerializerPlugin)({
            projectRoot: options.projectRoot,
            debug: env_1.env.EXPO_DEBUG,
        }));
    }
    return withSerializerPlugins(config, processors, options);
}
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors, options = {}) {
    const expoSerializer = createSerializerFromSerialProcessors(config, processors, config.serializer?.customSerializer ?? null, options);
    // We can't object-spread the config, it loses the reference to the original config
    // Meaning that any user-provided changes are not propagated to the serializer config
    // @ts-expect-error TODO(cedric): it's a read only property, but we can actually write it
    config.serializer ??= {};
    // @ts-expect-error TODO(cedric): it's a read only property, but we can actually write it
    config.serializer.customSerializer = expoSerializer;
    return config;
}
function createDefaultExportCustomSerializer(config, configOptions = {}) {
    return async (entryPoint, preModules, graph, inputOptions) => {
        // NOTE(@kitten): My guess is that this was supposed to always be disabled for `node` since we set `hot: true` manually for it
        const isPossiblyDev = graph.transformOptions.dev ||
            graph.transformOptions.customTransformOptions?.environment === 'node';
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
        // Only invoke the custom serializer if it's not our serializer
        // We write the Expo serializer back to the original config object, possibly falling into recursive loops
        const originalCustomSerializer = unwrapOriginalSerializer(config.serializer?.customSerializer);
        if (originalCustomSerializer) {
            const bundle = await originalCustomSerializer(entryPoint, premodulesToBundle, graph, options);
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
        // For RSC client boundary chunks: append registration code so the module
        // can be resolved by stable ID after the chunk is loaded.
        // This enables dynamic loading of client boundaries without requiring
        // them to be known at build time.
        if (options.sourceUrl) {
            const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
                ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
                : options.sourceUrl;
            const parsed = new URL(sourceUrl, 'http://expo.dev');
            const rscStableId = parsed.searchParams.get('rscStableId');
            if (rscStableId && bundleCode) {
                // Get the module ID for the entry point module
                const entryModuleId = options.createModuleId(entryPoint);
                // Append registration code to allow __webpack_require__(stableId) to work
                bundleCode += `\n;typeof __expo_rsc_register__==="function"&&__expo_rsc_register__(${JSON.stringify(rscStableId)},${JSON.stringify(entryModuleId)});`;
            }
        }
        const getEnsuredMaps = () => {
            bundleMap ??= (0, sourceMapString_1.sourceMapString)([...premodulesToBundle, ...(0, serializeChunks_1.getSortedModules)([...graph.dependencies.values()], options)], {
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
function getDefaultSerializer(config, fallbackSerializer, configOptions = {}) {
    const defaultSerializer = fallbackSerializer ?? createDefaultExportCustomSerializer(config, configOptions);
    const expoSerializer = async (entryPoint, preModules, graph, inputOptions) => {
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
    return Object.assign(expoSerializer, { __expoSerializer: true });
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer, options = {}) {
    const finalSerializer = getDefaultSerializer(config, originalSerializer, options);
    return wrapSerializerWithOriginal(originalSerializer, async (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = await processor(...props);
            }
        }
        return finalSerializer(...props);
    });
}
function wrapSerializerWithOriginal(original, expo) {
    return Object.assign(expo, { __originalSerializer: original });
}
function unwrapOriginalSerializer(serializer) {
    if (!serializer || !('__originalSerializer' in serializer))
        return null;
    return serializer.__originalSerializer;
}
//# sourceMappingURL=withExpoSerializers.js.map