"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedModules = exports.Chunk = exports.graphToSerialAssetsAsync = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const assert_1 = __importDefault(require("assert"));
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const debugId_1 = require("./debugId");
const exportHermes_1 = require("./exportHermes");
const exportPath_1 = require("./exportPath");
const baseJSBundle_1 = require("./fork/baseJSBundle");
const getCssDeps_1 = require("./getCssDeps");
const getAssets_1 = __importDefault(require("../transform-worker/getAssets"));
// Convert file paths to regex matchers.
function pathToRegex(path) {
    // Escape regex special characters, except for '*'
    let regexSafePath = path.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
    // Replace '*' with '.*' to act as a wildcard in regex
    regexSafePath = regexSafePath.replace(/\*/g, '.*');
    // Create a RegExp object with the modified string
    return new RegExp('^' + regexSafePath + '$');
}
async function graphToSerialAssetsAsync(config, serializeChunkOptions, ...props) {
    const [entryFile, preModules, graph, options] = props;
    const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
        projectRoot: options.projectRoot,
        processModuleFilter: options.processModuleFilter,
    });
    // Create chunks for splitting.
    const chunks = new Set();
    [
        {
            test: pathToRegex(entryFile),
        },
    ].map((chunkSettings) => gatherChunks(chunks, chunkSettings, preModules, graph, options, false));
    // Get the common modules and extract them into a separate chunk.
    const entryChunk = [...chunks.values()].find((chunk) => !chunk.isAsync && chunk.hasAbsolutePath(entryFile));
    if (entryChunk) {
        for (const chunk of chunks.values()) {
            if (chunk !== entryChunk && chunk.isAsync) {
                for (const dep of chunk.deps.values()) {
                    if (entryChunk.deps.has(dep)) {
                        // Remove the dependency from the async chunk since it will be loaded in the main chunk.
                        chunk.deps.delete(dep);
                    }
                }
            }
        }
        const toCompare = [...chunks.values()];
        const commonDependencies = [];
        while (toCompare.length) {
            const chunk = toCompare.shift();
            for (const chunk2 of toCompare) {
                if (chunk !== chunk2 && chunk.isAsync && chunk2.isAsync) {
                    const commonDeps = [...chunk.deps].filter((dep) => chunk2.deps.has(dep));
                    for (const dep of commonDeps) {
                        chunk.deps.delete(dep);
                        chunk2.deps.delete(dep);
                    }
                    commonDependencies.push(...commonDeps);
                }
            }
        }
        // If common dependencies were found, extract them to the entry chunk.
        // TODO: Extract the metro-runtime to a common chunk apart from the entry chunk then load the common dependencies before the entry chunk.
        if (commonDependencies.length) {
            for (const dep of commonDependencies) {
                entryChunk.deps.add(dep);
            }
            // const commonDependenciesUnique = [...new Set(commonDependencies)];
            // const commonChunk = new Chunk(
            //   chunkIdForModules(commonDependenciesUnique),
            //   commonDependenciesUnique,
            //   graph,
            //   options,
            //   false,
            //   true
            // );
            // entryChunk.requiredChunks.add(commonChunk);
            // chunks.add(commonChunk);
        }
        // TODO: Optimize this pass more.
        // Remove all dependencies from async chunks that are already in the common chunk.
        for (const chunk of [...chunks.values()]) {
            if (chunk !== entryChunk) {
                for (const dep of chunk.deps) {
                    if (entryChunk.deps.has(dep)) {
                        chunk.deps.delete(dep);
                    }
                }
            }
        }
    }
    const jsAssets = await serializeChunksAsync(chunks, config.serializer ?? {}, serializeChunkOptions);
    // TODO: Can this be anything besides true?
    const isExporting = true;
    const baseUrl = (0, baseJSBundle_1.getBaseUrlOption)(graph, { serializerOptions: serializeChunkOptions });
    const assetPublicUrl = (baseUrl.replace(/\/+$/, '') ?? '') + '/assets';
    const publicPath = isExporting
        ? graph.transformOptions.platform === 'web'
            ? `/assets?export_path=${assetPublicUrl}`
            : assetPublicUrl
        : '/assets/?unstable_path=.';
    // TODO: Convert to serial assets
    // TODO: Disable this call dynamically in development since assets are fetched differently.
    const metroAssets = (await (0, getAssets_1.default)(graph.dependencies, {
        processModuleFilter: options.processModuleFilter,
        assetPlugins: config.transformer?.assetPlugins ?? [],
        platform: (0, baseJSBundle_1.getPlatformOption)(graph, options) ?? 'web',
        projectRoot: options.projectRoot,
        publicPath,
    }));
    return { artifacts: [...jsAssets, ...cssDeps], assets: metroAssets };
}
exports.graphToSerialAssetsAsync = graphToSerialAssetsAsync;
class Chunk {
    name;
    entries;
    graph;
    options;
    isAsync;
    isVendor;
    deps = new Set();
    preModules = new Set();
    // Chunks that are required to be loaded synchronously before this chunk.
    // These are included in the HTML as <script> tags.
    requiredChunks = new Set();
    constructor(name, entries, graph, options, isAsync = false, isVendor = false) {
        this.name = name;
        this.entries = entries;
        this.graph = graph;
        this.options = options;
        this.isAsync = isAsync;
        this.isVendor = isVendor;
        this.deps = new Set(entries);
    }
    getPlatform() {
        (0, assert_1.default)(this.graph.transformOptions.platform, "platform is required to be in graph's transformOptions");
        return this.graph.transformOptions.platform;
    }
    getFilename(src) {
        return this.options.dev
            ? this.name
            : (0, exportPath_1.getExportPathForDependencyWithOptions)(this.name, {
                platform: this.getPlatform(),
                src,
                serverRoot: this.options.serverRoot,
            });
    }
    getStableChunkSource(serializerConfig) {
        return this.options.dev
            ? ''
            : this.serializeToCodeWithTemplates(serializerConfig, {
                // Disable source maps when creating a sha to reduce the number of possible changes that could
                // influence the cache hit.
                serializerOptions: {
                    includeSourceMaps: false,
                },
                sourceMapUrl: undefined,
                debugId: undefined,
            });
    }
    getFilenameForConfig(serializerConfig) {
        return this.getFilename(this.getStableChunkSource(serializerConfig));
    }
    serializeToCodeWithTemplates(serializerConfig, options = {}) {
        const entryFile = this.name;
        // TODO: Disable all debugId steps when a dev server is enabled. This is an export-only feature.
        const preModules = [...this.preModules.values()];
        const dependencies = [...this.deps];
        const jsSplitBundle = (0, baseJSBundle_1.baseJSBundleWithDependencies)(entryFile, preModules, dependencies, {
            ...this.options,
            runBeforeMainModule: serializerConfig?.getModulesRunBeforeMainModule?.(path_1.default.relative(this.options.projectRoot, entryFile)) ?? [],
            runModule: !this.isVendor && !this.isAsync,
            modulesOnly: this.preModules.size === 0,
            platform: this.getPlatform(),
            baseUrl: (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options),
            splitChunks: !!this.options.serializerOptions?.splitChunks,
            skipWrapping: true,
            computedAsyncModulePaths: null,
            ...options,
        });
        return (0, bundleToString_1.default)(jsSplitBundle).code;
    }
    hasAbsolutePath(absolutePath) {
        return [...this.deps].some((module) => module.path === absolutePath);
    }
    getComputedPathsForAsyncDependencies(serializerConfig, chunks) {
        const baseUrl = (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options);
        // Only calculate production paths when all chunks are being exported.
        if (this.options.includeAsyncPaths) {
            return null;
        }
        const computedAsyncModulePaths = {};
        this.deps.forEach((module) => {
            module.dependencies.forEach((dependency) => {
                if (dependency.data.data.asyncType) {
                    const chunkContainingModule = chunks.find((chunk) => chunk.hasAbsolutePath(dependency.absolutePath));
                    (0, assert_1.default)(chunkContainingModule, 'Chunk containing module not found: ' + dependency.absolutePath);
                    // NOTE(kitten): We shouldn't have any async imports on non-async chunks
                    // However, due to how chunks merge, some async imports may now be pointing
                    // at entrypoint (or vendor) chunks. We omit the path so that the async import
                    // helper doesn't reload and reevaluate the entrypoint.
                    if (chunkContainingModule.isAsync) {
                        const moduleIdName = chunkContainingModule.getFilenameForConfig(serializerConfig);
                        computedAsyncModulePaths[dependency.absolutePath] = (baseUrl ?? '/') + moduleIdName;
                    }
                }
            });
        });
        return computedAsyncModulePaths;
    }
    getAdjustedSourceMapUrl(serializerConfig) {
        // Metro really only accounts for development, so we'll use the defaults here.
        if (this.options.dev) {
            return this.options.sourceMapUrl ?? null;
        }
        if (this.options.serializerOptions?.includeSourceMaps !== true) {
            return null;
        }
        if (this.options.inlineSourceMap || !this.options.sourceMapUrl) {
            return this.options.sourceMapUrl ?? null;
        }
        const isAbsolute = this.getPlatform() !== 'web';
        const baseUrl = (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options);
        const filename = this.getFilenameForConfig(serializerConfig);
        const isAbsoluteBaseUrl = !!baseUrl?.match(/https?:\/\//);
        const pathname = (isAbsoluteBaseUrl ? '' : baseUrl.replace(/\/+$/, '')) +
            '/' +
            filename.replace(/^\/+$/, '') +
            '.map';
        let adjustedSourceMapUrl = this.options.sourceMapUrl;
        // Metro has lots of issues...
        if (this.options.sourceMapUrl.startsWith('//localhost')) {
            adjustedSourceMapUrl = 'http:' + this.options.sourceMapUrl;
        }
        try {
            const parsed = new URL(pathname, isAbsoluteBaseUrl ? baseUrl : adjustedSourceMapUrl);
            if (isAbsoluteBaseUrl || isAbsolute) {
                return parsed.href;
            }
            return parsed.pathname;
        }
        catch (error) {
            console.error(`Failed to link source maps because the source map URL "${this.options.sourceMapUrl}" is corrupt:`, error);
            return null;
        }
    }
    serializeToCode(serializerConfig, { debugId, chunks }) {
        return this.serializeToCodeWithTemplates(serializerConfig, {
            skipWrapping: false,
            sourceMapUrl: this.getAdjustedSourceMapUrl(serializerConfig) ?? undefined,
            computedAsyncModulePaths: this.getComputedPathsForAsyncDependencies(serializerConfig, chunks),
            debugId,
        });
    }
    boolishTransformOption(name) {
        const value = this.graph.transformOptions?.customTransformOptions?.[name];
        return value === true || value === 'true';
    }
    async serializeToAssetsAsync(serializerConfig, chunks, { includeSourceMaps, unstable_beforeAssetSerializationPlugins }) {
        // Create hash without wrapping to prevent it changing when the wrapping changes.
        const outputFile = this.getFilenameForConfig(serializerConfig);
        // We already use a stable hash for the output filename, so we'll reuse that for the debugId.
        const debugId = (0, debugId_1.stringToUUID)(path_1.default.basename(outputFile, path_1.default.extname(outputFile)));
        let premodules = [...this.preModules];
        if (unstable_beforeAssetSerializationPlugins) {
            for (const plugin of unstable_beforeAssetSerializationPlugins) {
                premodules = plugin({ graph: this.graph, premodules, debugId });
            }
            this.preModules = new Set(premodules);
        }
        const jsCode = this.serializeToCode(serializerConfig, { chunks, debugId });
        const relativeEntry = path_1.default.relative(this.options.projectRoot, this.name);
        const jsAsset = {
            filename: outputFile,
            originFilename: relativeEntry,
            type: 'js',
            metadata: {
                isAsync: this.isAsync,
                requires: [...this.requiredChunks.values()].map((chunk) => chunk.getFilenameForConfig(serializerConfig)),
                // Provide a list of module paths that can be used for matching chunks to routes.
                // TODO: Move HTML serializing closer to this code so we can reduce passing this much data around.
                modulePaths: [...this.deps].map((module) => module.path),
            },
            source: jsCode,
        };
        const assets = [jsAsset];
        const mutateSourceMapWithDebugId = (sourceMap) => {
            // TODO: Upstream this so we don't have to parse the source map back and forth.
            if (!debugId) {
                return sourceMap;
            }
            // NOTE: debugId isn't required for inline source maps because the source map is included in the same file, therefore
            // we don't need to disambiguate between multiple source maps.
            const sourceMapObject = JSON.parse(sourceMap);
            sourceMapObject.debugId = debugId;
            // NOTE: Sentry does this, but bun does not.
            // sourceMapObject.debug_id = debugId;
            return JSON.stringify(sourceMapObject);
        };
        if (
        // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
        includeSourceMaps &&
            !this.options.inlineSourceMap &&
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
            // TODO: We may not need to mutate the original source map with a `debugId` when hermes is enabled since we'll have different source maps.
            const sourceMap = mutateSourceMapWithDebugId((0, sourceMapString_1.default)(modules, {
                excludeSource: false,
                ...this.options,
            }));
            assets.push({
                filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
                originFilename: jsAsset.originFilename,
                type: 'map',
                metadata: {},
                source: sourceMap,
            });
        }
        if (this.boolishTransformOption('bytecode') && this.isHermesEnabled()) {
            const adjustedSource = jsAsset.source.replace(/^\/\/# (sourceMappingURL)=(.*)$/gm, (...props) => {
                if (props[1] === 'sourceMappingURL') {
                    const mapName = props[2].replace(/\.js\.map$/, '.hbc.map');
                    return `//# ${props[1]}=` + mapName;
                }
                return '';
            });
            // TODO: Generate hbc for each chunk
            const hermesBundleOutput = await (0, exportHermes_1.buildHermesBundleAsync)({
                filename: this.name,
                code: adjustedSource,
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
                assets[1].source = mutateSourceMapWithDebugId(hermesBundleOutput.sourcemap);
                assets[1].filename = assets[1].filename.replace(/\.js\.map$/, '.hbc.map');
            }
        }
        return assets;
    }
    supportsBytecode() {
        return this.getPlatform() !== 'web';
    }
    isHermesEnabled() {
        // TODO: Revisit.
        // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
        // also create hermes bytecode. We may need to disable in one of the two places.
        return (!this.options.dev &&
            this.supportsBytecode() &&
            this.graph.transformOptions.customTransformOptions?.engine === 'hermes');
    }
}
exports.Chunk = Chunk;
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
    // Prevent processing the same entry file twice.
    if (!entryModules.length) {
        return chunks;
    }
    const entryChunk = new Chunk(chunkIdForModules(entryModules), entryModules, graph, options, isAsync);
    // Add all the pre-modules to the first chunk.
    if (preModules.length) {
        // On native, use the preModules in insert code in the entry chunk.
        for (const module of preModules.values()) {
            entryChunk.preModules.add(module);
        }
    }
    chunks.add(entryChunk);
    function includeModule(entryModule) {
        for (const dependency of entryModule.dependencies.values()) {
            if (dependency.data.data.asyncType &&
                // Support disabling multiple chunks.
                entryChunk.options.serializerOptions?.splitChunks !== false) {
                gatherChunks(chunks, { test: pathToRegex(dependency.absolutePath) }, [], graph, options, true);
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
async function serializeChunksAsync(chunks, serializerConfig, options) {
    const jsAssets = [];
    const chunksArray = [...chunks.values()];
    await Promise.all(chunksArray.map(async (chunk) => {
        jsAssets.push(...(await chunk.serializeToAssetsAsync(serializerConfig, chunksArray, options)));
    }));
    return jsAssets;
}
function getSortedModules(modules, { createModuleId, }) {
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
exports.getSortedModules = getSortedModules;
//# sourceMappingURL=serializeChunks.js.map