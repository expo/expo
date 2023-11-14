"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.graphToSerialAssetsAsync = graphToSerialAssetsAsync;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _getAssets() {
  const data = _interopRequireDefault(require("metro/src/DeltaBundler/Serializers/getAssets"));
  _getAssets = function () {
    return data;
  };
  return data;
}
function _sourceMapString() {
  const data = _interopRequireDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
  _sourceMapString = function () {
    return data;
  };
  return data;
}
function _bundleToString() {
  const data = _interopRequireDefault(require("metro/src/lib/bundleToString"));
  _bundleToString = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _pathToRegexp() {
  const data = _interopRequireDefault(require("path-to-regexp"));
  _pathToRegexp = function () {
    return data;
  };
  return data;
}
function _exportHermes() {
  const data = require("./exportHermes");
  _exportHermes = function () {
    return data;
  };
  return data;
}
function _exportPath() {
  const data = require("./exportPath");
  _exportPath = function () {
    return data;
  };
  return data;
}
function _baseJSBundle() {
  const data = require("./fork/baseJSBundle");
  _baseJSBundle = function () {
    return data;
  };
  return data;
}
function _getCssDeps() {
  const data = require("./getCssDeps");
  _getCssDeps = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
async function graphToSerialAssetsAsync(config, serializeChunkOptions, ...props) {
  var _config$serializer, _assetPlugins, _getPlatformOption;
  const [entryFile, preModules, graph, options] = props;
  const cssDeps = (0, _getCssDeps().getCssSerialAssets)(graph.dependencies, {
    projectRoot: options.projectRoot,
    processModuleFilter: options.processModuleFilter
  });

  // Create chunks for splitting.
  const chunks = new Set();
  [{
    test: (0, _pathToRegexp().default)(entryFile)
  }].map(chunkSettings => gatherChunks(chunks, chunkSettings, preModules, graph, options, false));
  const jsAssets = await serializeChunksAsync(chunks, (_config$serializer = config.serializer) !== null && _config$serializer !== void 0 ? _config$serializer : {}, serializeChunkOptions);

  // TODO: Convert to serial assets
  // TODO: Disable this call dynamically in development since assets are fetched differently.
  const metroAssets = await (0, _getAssets().default)(graph.dependencies, {
    processModuleFilter: options.processModuleFilter,
    assetPlugins: (_assetPlugins = config.transformer.assetPlugins) !== null && _assetPlugins !== void 0 ? _assetPlugins : [],
    platform: (_getPlatformOption = (0, _baseJSBundle().getPlatformOption)(graph, options)) !== null && _getPlatformOption !== void 0 ? _getPlatformOption : 'web',
    projectRoot: options.projectRoot,
    // this._getServerRootDir(),
    publicPath: config.transformer.publicPath
  });
  return {
    artifacts: [...jsAssets, ...cssDeps],
    assets: metroAssets
  };
}
class Chunk {
  // Chunks that are required to be loaded synchronously before this chunk.
  // These are included in the HTML as <script> tags.

  constructor(name, entries, graph, options, isAsync = false) {
    this.name = name;
    this.entries = entries;
    this.graph = graph;
    this.options = options;
    this.isAsync = isAsync;
    _defineProperty(this, "deps", new Set());
    _defineProperty(this, "preModules", new Set());
    _defineProperty(this, "requiredChunks", new Set());
    this.deps = new Set(entries);
  }
  getPlatform() {
    (0, _assert().default)(this.graph.transformOptions.platform, "platform is required to be in graph's transformOptions");
    return this.graph.transformOptions.platform;
  }
  getFilename(src) {
    return this.options.dev ? this.name : (0, _exportPath().getExportPathForDependencyWithOptions)(this.name, {
      platform: this.getPlatform(),
      src,
      serverRoot: this.options.serverRoot
    });
  }
  getFilenameForConfig(serializerConfig) {
    return this.getFilename(this.options.dev ? '' : this.serializeToCodeWithTemplates(serializerConfig));
  }
  serializeToCodeWithTemplates(serializerConfig, options = {}) {
    var _serializerConfig$get, _serializerConfig$get2;
    const entryFile = this.name;
    const fileName = _path().default.basename(entryFile, '.js');
    const jsSplitBundle = (0, _baseJSBundle().baseJSBundleWithDependencies)(entryFile, [...this.preModules.values()], [...this.deps], {
      ...this.options,
      runBeforeMainModule: (_serializerConfig$get = serializerConfig === null || serializerConfig === void 0 ? void 0 : (_serializerConfig$get2 = serializerConfig.getModulesRunBeforeMainModule) === null || _serializerConfig$get2 === void 0 ? void 0 : _serializerConfig$get2.call(serializerConfig, _path().default.relative(this.options.projectRoot, entryFile))) !== null && _serializerConfig$get !== void 0 ? _serializerConfig$get : [],
      runModule: !this.isAsync,
      modulesOnly: this.preModules.size === 0,
      platform: this.getPlatform(),
      sourceMapUrl: `${fileName}.map`,
      baseUrl: (0, _baseJSBundle().getBaseUrlOption)(this.graph, this.options),
      splitChunks: (0, _baseJSBundle().getSplitChunksOption)(this.graph, this.options),
      skipWrapping: true,
      computedAsyncModulePaths: null,
      ...options
    });
    return (0, _bundleToString().default)(jsSplitBundle).code;
  }
  hasAbsolutePath(absolutePath) {
    return [...this.deps].some(module => module.path === absolutePath);
  }
  getComputedPathsForAsyncDependencies(serializerConfig, chunks) {
    const baseUrl = (0, _baseJSBundle().getBaseUrlOption)(this.graph, this.options);
    // Only calculate production paths when all chunks are being exported.
    if (this.options.includeAsyncPaths) {
      return null;
    }
    const computedAsyncModulePaths = {};
    this.deps.forEach(module => {
      module.dependencies.forEach(dependency => {
        if (dependency.data.data.asyncType === 'async') {
          const chunkContainingModule = chunks.find(chunk => chunk.hasAbsolutePath(dependency.absolutePath));
          (0, _assert().default)(chunkContainingModule, 'Chunk containing module not found: ' + dependency.absolutePath);
          const moduleIdName = chunkContainingModule.getFilenameForConfig(serializerConfig);
          computedAsyncModulePaths[dependency.absolutePath] = (baseUrl !== null && baseUrl !== void 0 ? baseUrl : '/') + moduleIdName;
        }
      });
    });
    return computedAsyncModulePaths;
  }
  serializeToCode(serializerConfig, chunks) {
    return this.serializeToCodeWithTemplates(serializerConfig, {
      skipWrapping: false,
      computedAsyncModulePaths: this.getComputedPathsForAsyncDependencies(serializerConfig, chunks)
    });
  }
  async serializeToAssetsAsync(serializerConfig, chunks, {
    includeSourceMaps,
    includeBytecode
  }) {
    const jsCode = this.serializeToCode(serializerConfig, chunks);
    const relativeEntry = _path().default.relative(this.options.projectRoot, this.name);
    const outputFile = this.getFilenameForConfig(
    // Create hash without wrapping to prevent it changing when the wrapping changes.
    serializerConfig);
    const jsAsset = {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        isAsync: this.isAsync,
        requires: [...this.requiredChunks.values()].map(chunk => chunk.getFilenameForConfig(serializerConfig))
      },
      source: jsCode
    };
    const assets = [jsAsset];
    if (
    // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
    includeSourceMaps && this.options.sourceMapUrl) {
      const modules = [...this.preModules, ...getSortedModules([...this.deps], {
        createModuleId: this.options.createModuleId
      })].map(module => {
        // TODO: Make this user-configurable.

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        if (module.path.startsWith('/')) {
          var _this$options$serverR;
          return {
            ...module,
            path: '/' + _path().default.relative((_this$options$serverR = this.options.serverRoot) !== null && _this$options$serverR !== void 0 ? _this$options$serverR : this.options.projectRoot, module.path)
          };
        }
        return module;
      });
      const sourceMap = (0, _sourceMapString().default)(modules, {
        ...this.options
      });
      assets.push({
        filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
        originFilename: jsAsset.originFilename,
        type: 'map',
        metadata: {},
        source: sourceMap
      });
    }
    if (includeBytecode && this.isHermesEnabled()) {
      // TODO: Generate hbc for each chunk
      const hermesBundleOutput = await (0, _exportHermes().buildHermesBundleAsync)({
        filename: this.name,
        code: jsAsset.source,
        map: assets[1] ? assets[1].source : null,
        // TODO: Maybe allow prod + no minify.
        minify: true //!this.options.dev,
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
  supportsBytecode() {
    return this.getPlatform() !== 'web';
  }
  isHermesEnabled() {
    var _this$graph$transform;
    // TODO: Revisit.
    // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
    // also create hermes bytecode. We may need to disable in one of the two places.
    return !this.options.dev && this.supportsBytecode() && ((_this$graph$transform = this.graph.transformOptions.customTransformOptions) === null || _this$graph$transform === void 0 ? void 0 : _this$graph$transform.engine) === 'hermes';
  }
}
function getEntryModulesForChunkSettings(graph, settings) {
  return [...graph.dependencies.entries()].filter(([path]) => settings.test.test(path)).map(([, module]) => module);
}
function chunkIdForModules(modules) {
  return modules.map(module => module.path).sort().join('=>');
}
function gatherChunks(chunks, settings, preModules, graph, options, isAsync = false) {
  let entryModules = getEntryModulesForChunkSettings(graph, settings);
  const existingChunks = [...chunks.values()];
  entryModules = entryModules.filter(module => {
    return !existingChunks.find(chunk => chunk.entries.includes(module));
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
  const splitChunks = (0, _baseJSBundle().getSplitChunksOption)(graph, options);
  function includeModule(entryModule) {
    for (const dependency of entryModule.dependencies.values()) {
      if (dependency.data.data.asyncType === 'async' &&
      // Support disabling multiple chunks.
      splitChunks) {
        gatherChunks(chunks, {
          test: (0, _pathToRegexp().default)(dependency.absolutePath)
        }, [], graph, options, true);
      } else {
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
async function serializeChunksAsync(chunks, serializerConfig, {
  includeSourceMaps,
  includeBytecode
}) {
  const jsAssets = [];
  const chunksArray = [...chunks.values()];
  await Promise.all(chunksArray.map(async chunk => {
    jsAssets.push(...(await chunk.serializeToAssetsAsync(serializerConfig, chunksArray, {
      includeSourceMaps,
      includeBytecode
    })));
  }));
  return jsAssets;
}
function getSortedModules(modules, {
  createModuleId
}) {
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
//# sourceMappingURL=serializeChunks.js.map