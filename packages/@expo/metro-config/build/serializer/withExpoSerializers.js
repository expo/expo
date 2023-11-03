"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.getDefaultSerializer = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const jsc_safe_url_1 = require("jsc-safe-url");
const baseJSBundle_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
// @ts-expect-error
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const getCssDeps_1 = require("./getCssDeps");
const sideEffectsSerializerPlugin_1 = require("./sideEffectsSerializerPlugin");
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
const env_1 = require("../env");
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    // First mark which modules have side-effects according to the `package.json`s.
    processors.push(sideEffectsSerializerPlugin_1.sideEffectsSerializerPlugin);
    // Then tree-shake the modules.
    processors.push((0, treeShakeSerializerPlugin_1.treeShakeSerializerPlugin)(config));
    // Then finish transforming the modules from AST to JS.
    processors.push((0, treeShakeSerializerPlugin_1.createPostTreeShakeTransformSerializerPlugin)(config));
    return withSerializerPlugins(config, processors);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors) {
    const originalSerializer = config.serializer?.customSerializer;
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
function getDefaultSerializer(fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.default)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [entryPoint, preModules, graph, options] = props;
        // if (process.env.NODE_ENV !== 'test') toFixture(...props);
        const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);
        // console.log('OUTPUT CODE', jsCode);
        if (!options.sourceUrl) {
            return jsCode;
        }
        const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
            ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
            : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        if (url.searchParams.get('platform') !== 'web' ||
            url.searchParams.get('serializer.output') !== 'static') {
            // Default behavior if `serializer.output=static` is not present in the URL.
            return jsCode;
        }
        const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';
        const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
            projectRoot: options.projectRoot,
            processModuleFilter: options.processModuleFilter,
        });
        const jsAssets = [];
        if (jsCode) {
            const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
            const jsFilename = (0, getCssDeps_1.fileNameFromContents)({
                filepath: url.pathname,
                src: stringContents,
            });
            jsAssets.push({
                filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
                originFilename: 'index.js',
                type: 'js',
                metadata: {},
                source: stringContents,
            });
            if (
            // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
            includeSourceMaps &&
                options.sourceMapUrl) {
                const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;
                // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
                const parsed = JSON.parse(sourceMap);
                // TODO: Maybe we can do this earlier.
                parsed.sources = parsed.sources.map(
                // TODO: Maybe basePath support
                (value) => {
                    if (value.startsWith('/')) {
                        return '/' + path_1.default.relative(options.serverRoot ?? options.projectRoot, value);
                    }
                    // Prevent `__prelude__` from being relative.
                    return value;
                });
                jsAssets.push({
                    filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
                    originFilename: 'index.map',
                    type: 'map',
                    metadata: {},
                    source: JSON.stringify(parsed),
                });
            }
        }
        return JSON.stringify([...jsAssets, ...cssDeps]);
    };
}
exports.getDefaultSerializer = getDefaultSerializer;
function getSortedModules(graph, { createModuleId, }) {
    const modules = [...graph.dependencies.values()];
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
function serializeToSourceMap(...props) {
    const [, prepend, graph, options] = props;
    const modules = [
        ...prepend,
        ...getSortedModules(graph, {
            createModuleId: options.createModuleId,
        }),
    ];
    return (0, sourceMapString_1.default)(modules, {
        ...options,
    });
}
function createSerializerFromSerialProcessors(processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(originalSerializer);
    return async (...props) => {
        // toFixture(...props);
        for (const processor of processors) {
            if (processor) {
                props = await processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
