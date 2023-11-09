"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.graphToSerialAssetsAsync = exports.getDefaultSerializer = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const assert_1 = __importDefault(require("assert"));
const jsc_safe_url_1 = require("jsc-safe-url");
// @ts-expect-error
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const exportPath_1 = require("./exportPath");
// import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
const baseJSBundle_1 = require("./fork/baseJSBundle");
const getCssDeps_1 = require("./getCssDeps");
const env_1 = require("../env");
const exportHermes_1 = require("./exportHermes");
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
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
            customSerializer: createSerializerFromSerialProcessors(
            // @ts-expect-error
            config.serializer ?? {}, processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
function getDefaultSerializer(serializerConfig, fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.baseJSBundle)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [entryFile, preModules, graph, options] = props;
        // @ts-expect-error
        const customSerializerOptions = options.serializerOptions;
        // Custom options can only be passed outside of the dev server, meaning
        // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
        const supportsNonSerialReturn = !!customSerializerOptions?.output;
        const serializerOptions = (() => {
            if (customSerializerOptions) {
                return {
                    outputMode: customSerializerOptions.output,
                    includeSourceMaps: customSerializerOptions.includeMaps,
                };
            }
            if (options.sourceUrl) {
                const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
                    ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
                    : options.sourceUrl;
                const url = new URL(sourceUrl, 'https://expo.dev');
                return {
                    outputMode: url.searchParams.get('serializer.output'),
                    includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
                };
            }
            return null;
        })();
        if (serializerOptions?.outputMode !== 'static') {
            return defaultSerializer(...props);
        }
        const assets = await graphToSerialAssetsAsync(serializerConfig, { includeMaps: serializerOptions.includeSourceMaps }, ...props);
        if (supportsNonSerialReturn) {
            // @ts-expect-error: this is future proofing for adding assets to the output as well.
            return assets;
        }
        return JSON.stringify(assets);
    };
}
exports.getDefaultSerializer = getDefaultSerializer;
const path_to_regexp_1 = __importDefault(require("path-to-regexp"));
async function graphToSerialAssetsAsync(serializerConfig, { includeMaps }, ...props) {
    const [entryFile, preModules, graph, options] = props;
    const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
        projectRoot: options.projectRoot,
        processModuleFilter: options.processModuleFilter,
    });
    // Create chunks for splitting.
    const _chunks = new Set();
    [
        {
            test: (0, path_to_regexp_1.default)(entryFile),
        },
    ].map((chunkSettings) => gatherChunks(_chunks, chunkSettings, preModules, graph, options, false));
    // console.log('Chunks:');
    // console.log(inspect([..._chunks], { depth: 3, colors: true }));
    // Optimize the chunks
    // dedupeChunks(_chunks);
    const jsAssets = await serializeChunksAsync(_chunks, serializerConfig, {
        includeSourceMaps: includeMaps,
    });
    return [...jsAssets, ...cssDeps];
}
exports.graphToSerialAssetsAsync = graphToSerialAssetsAsync;
class Chunk {
    name;
    entries;
    graph;
    options;
    isAsync;
    deps = new Set();
    preModules = new Set();
    // Chunks that are required to be loaded synchronously before this chunk.
    // These are included in the HTML as <script> tags.
    requiredChunks = new Set();
    constructor(name, entries, graph, options, isAsync = false) {
        this.name = name;
        this.entries = entries;
        this.graph = graph;
        this.options = options;
        this.isAsync = isAsync;
        this.deps = new Set(entries);
    }
    getPlatform() {
        (0, assert_1.default)(this.graph.transformOptions.platform, "platform is required to be in graph's transformOptions");
        return this.graph.transformOptions.platform;
    }
    getFilename() {
        // TODO: Content hash is needed
        return this.options.dev
            ? this.name
            : (0, exportPath_1.getExportPathForDependencyWithOptions)(this.name, {
                platform: this.getPlatform(),
                serverRoot: this.options.serverRoot,
            });
    }
    serializeToCode(serializerConfig) {
        const entryFile = this.name;
        const fileName = path_1.default.basename(entryFile, '.js');
        const jsSplitBundle = (0, baseJSBundle_1.baseJSBundleWithDependencies)(entryFile, [...this.preModules.values()], [...this.deps], {
            ...this.options,
            runBeforeMainModule: serializerConfig?.getModulesRunBeforeMainModule?.(path_1.default.relative(this.options.projectRoot, entryFile)) ?? [],
            // searchParams.set('modulesOnly', 'true');
            // searchParams.set('runModule', 'false');
            // TODO: Test cases when an async module has global side-effects that should be run.
            // This should be fine as those side-effects would be defined in the module itself, which would be executed upon loading.
            runModule: !this.isAsync,
            modulesOnly: this.preModules.size === 0,
            platform: this.getPlatform(),
            sourceMapUrl: `${fileName}.map`,
            basePath: (0, baseJSBundle_1.getBasePathOption)(this.graph, this.options) ?? '/',
            splitChunks: (0, baseJSBundle_1.getSplitChunksOption)(this.graph, this.options),
        });
        return (0, bundleToString_1.default)(jsSplitBundle).code;
    }
    async serializeToAssetsAsync(serializerConfig, { includeSourceMaps }) {
        const jsCode = this.serializeToCode(serializerConfig);
        const relativeEntry = path_1.default.relative(this.options.projectRoot, this.name);
        const outputFile = this.getFilename();
        const jsAsset = {
            filename: outputFile,
            originFilename: relativeEntry,
            type: 'js',
            metadata: {
                isAsync: this.isAsync,
                requires: [...this.requiredChunks.values()].map((chunk) => chunk.getFilename()),
            },
            source: jsCode,
        };
        const assets = [jsAsset];
        if (
        // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
        includeSourceMaps &&
            this.options.sourceMapUrl) {
            const modules = [
                ...this.preModules,
                ...getSortedModules([...this.deps], {
                    createModuleId: this.options.createModuleId,
                }),
            ].map((module) => {
                // TODO: Make this user-configurable.
                // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
                if (module.path.startsWith('/')) {
                    return {
                        ...module,
                        path: '/' + path_1.default.relative(this.options.serverRoot ?? this.options.projectRoot, module.path),
                    };
                }
                return module;
            });
            const sourceMap = (0, sourceMapString_1.default)(modules, {
                ...this.options,
            });
            assets.push({
                filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
                originFilename: jsAsset.originFilename,
                type: 'map',
                metadata: {},
                source: sourceMap,
            });
        }
        if (this.isHermesEnabled()) {
            // TODO: Generate hbc for each chunk
            const hermesBundleOutput = await (0, exportHermes_1.buildHermesBundleAsync)({
                filename: this.name,
                code: jsAsset.source,
                map: assets[1] ? assets[1].source : null,
                // TODO: Maybe allow prod + no minify.
                minify: true, //!this.options.dev,
            });
            if (hermesBundleOutput.hbc) {
                // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
                // jsAsset.metadata.hbc = hermesBundleOutput.hbc;
                // @ts-expect-error: TODO
                jsAsset.source = hermesBundleOutput.hbc;
                jsAsset.filename = jsAsset.filename.replace(/\.js$/, '.hbc');
            }
            if (assets[1] && hermesBundleOutput.sourcemap) {
                // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
                assets[1].source = hermesBundleOutput.sourcemap;
            }
        }
        return assets;
    }
    isHermesEnabled() {
        // TODO: Revisit.
        // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
        // also create hermes bytecode. We may need to disable in one of the two places.
        return (!this.options.dev &&
            this.getPlatform() !== 'web' &&
            this.graph.transformOptions.customTransformOptions?.engine === 'hermes');
    }
}
function getEntryModulesForChunkSettings(graph, settings) {
    return [...graph.dependencies.entries()]
        .filter(([path]) => settings.test.test(path))
        .map(([, module]) => module);
}
function chunkIdForModules(modules) {
    return modules
        .map((module) => module.path)
        .sort()
        .join('=>');
}
function gatherChunks(chunks, settings, preModules, graph, options, isAsync = false) {
    let entryModules = getEntryModulesForChunkSettings(graph, settings);
    const existingChunks = [...chunks.values()];
    entryModules = entryModules.filter((module) => {
        return !existingChunks.find((chunk) => chunk.entries.includes(module));
    });
    // if (!entryModules.length) {
    //   throw new Error('Entry module not found in graph: ' + entryFile);
    // }
    // Prevent processing the same entry file twice.
    if (!entryModules.length) {
        return chunks;
    }
    const entryChunk = new Chunk(chunkIdForModules(entryModules), entryModules, graph, options, isAsync);
    // Add all the pre-modules to the first chunk.
    if (preModules.length) {
        if (graph.transformOptions.platform === 'web' && !isAsync) {
            // On web, add a new required chunk that will be included in the HTML.
            const preChunk = new Chunk(chunkIdForModules([...preModules]), [...preModules], graph, options);
            // for (const module of preModules.values()) {
            //   preChunk.deps.add(module);
            // }
            chunks.add(preChunk);
            entryChunk.requiredChunks.add(preChunk);
        }
        else {
            // On native, use the preModules in insert code in the entry chunk.
            for (const module of preModules.values()) {
                entryChunk.preModules.add(module);
            }
        }
    }
    const splitChunks = (0, baseJSBundle_1.getSplitChunksOption)(graph, options);
    chunks.add(entryChunk);
    // entryChunk.deps.add(entryModule);
    function includeModule(entryModule) {
        for (const dependency of entryModule.dependencies.values()) {
            if (dependency.data.data.asyncType === 'async' &&
                // Support disabling multiple chunks.
                splitChunks) {
                gatherChunks(chunks, { test: (0, path_to_regexp_1.default)(dependency.absolutePath) }, [], graph, options, true);
            }
            else {
                const module = graph.dependencies.get(dependency.absolutePath);
                if (module) {
                    // Prevent circular dependencies from creating infinite loops.
                    if (!entryChunk.deps.has(module)) {
                        entryChunk.deps.add(module);
                        includeModule(module);
                    }
                }
            }
        }
    }
    for (const entryModule of entryModules) {
        includeModule(entryModule);
    }
    return chunks;
}
function dedupeChunks(chunks) {
    // Iterate chunks and pull duplicate modules into new common chunks that are required by the original chunks.
    // We can only de-dupe sync chunks since this would create vendor/shared chunks.
    const currentChunks = [...chunks.values()].filter((chunk) => !chunk.isAsync);
    for (const chunk of currentChunks) {
        const deps = [...chunk.deps.values()];
        for (const dep of deps) {
            for (const otherChunk of currentChunks) {
                if (otherChunk === chunk) {
                    continue;
                }
                if (otherChunk.deps.has(dep)) {
                    console.log('found common dep:', dep.path, 'in', chunk.name, 'and', otherChunk.name);
                    // Move the dep into a new chunk.
                    const newChunk = new Chunk(dep.path, dep.path, chunk.graph, chunk.options, false);
                    newChunk.deps.add(dep);
                    chunk.requiredChunks.add(newChunk);
                    otherChunk.requiredChunks.add(newChunk);
                    chunks.add(newChunk);
                    // Remove the dep from the original chunk.
                    chunk.deps.delete(dep);
                    otherChunk.deps.delete(dep);
                    // TODO: Pull all the deps of the dep into the new chunk.
                    for (const depDep of dep.dependencies.values()) {
                        if (depDep.data.data.asyncType === 'async') {
                            gatherChunks(chunks, depDep.absolutePath, [], chunk.graph, chunk.options, false);
                        }
                        else {
                            const module = chunk.graph.dependencies.get(depDep.absolutePath);
                            if (module) {
                                newChunk.deps.add(module);
                                if (chunk.deps.has(module)) {
                                    chunk.deps.delete(module);
                                }
                                if (otherChunk.deps.has(module)) {
                                    otherChunk.deps.delete(module);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
async function serializeChunksAsync(chunks, serializerConfig, { includeSourceMaps }) {
    const jsAssets = [];
    await Promise.all([...chunks].map(async (chunk) => {
        jsAssets.push(...(await chunk.serializeToAssetsAsync(serializerConfig, { includeSourceMaps })));
    }));
    return jsAssets;
}
function getSortedModules(modules, { createModuleId, }) {
    // const modules = [...graph.dependencies.values()];
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(config, originalSerializer);
    return (...props) => {
        // toFixture(...props);
        for (const processor of processors) {
            if (processor) {
                props = processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
