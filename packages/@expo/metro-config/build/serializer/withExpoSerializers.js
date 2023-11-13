"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "SerialAsset", {
  enumerable: true,
  get: function () {
    return _serializerAssets().SerialAsset;
  }
});
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
exports.graphToSerialAssetsAsync = graphToSerialAssetsAsync;
exports.withExpoSerializers = withExpoSerializers;
exports.withSerializerPlugins = withSerializerPlugins;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _jscSafeUrl() {
  const data = require("jsc-safe-url");
  _jscSafeUrl = function () {
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
function _environmentVariableSerializerPlugin() {
  const data = require("./environmentVariableSerializerPlugin");
  _environmentVariableSerializerPlugin = function () {
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
function _serializerAssets() {
  const data = require("./serializerAssets");
  _serializerAssets = function () {
    return data;
  };
  return data;
}
function _env() {
  const data = require("../env");
  _env = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function withExpoSerializers(config) {
  const processors = [];
  processors.push(_environmentVariableSerializerPlugin().serverPreludeSerializerPlugin);
  if (!_env().env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(_environmentVariableSerializerPlugin().environmentVariableSerializerPlugin);
  }
  return withSerializerPlugins(config, processors);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors) {
  var _config$serializer;
  const originalSerializer = (_config$serializer = config.serializer) === null || _config$serializer === void 0 ? void 0 : _config$serializer.customSerializer;
  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(config, processors, originalSerializer)
    }
  };
}
function getDefaultSerializer(config, fallbackSerializer) {
  const defaultSerializer = fallbackSerializer !== null && fallbackSerializer !== void 0 ? fallbackSerializer : async (...params) => {
    const bundle = (0, _baseJSBundle().baseJSBundle)(...params);
    const outputCode = (0, _bundleToString().default)(bundle).code;
    return outputCode;
  };
  return async (...props) => {
    const [entryFile, preModules, graph, options] = props;

    // @ts-expect-error
    const customSerializerOptions = options.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!(customSerializerOptions !== null && customSerializerOptions !== void 0 && customSerializerOptions.output);
    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          outputMode: customSerializerOptions.output,
          includeSourceMaps: customSerializerOptions.includeMaps
        };
      }
      if (options.sourceUrl) {
        const sourceUrl = (0, _jscSafeUrl().isJscSafeUrl)(options.sourceUrl) ? (0, _jscSafeUrl().toNormalUrl)(options.sourceUrl) : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        return {
          outputMode: url.searchParams.get('serializer.output'),
          includeSourceMaps: url.searchParams.get('serializer.map') === 'true'
        };
      }
      return null;
    })();
    if ((serializerOptions === null || serializerOptions === void 0 ? void 0 : serializerOptions.outputMode) !== 'static') {
      return defaultSerializer(...props);
    }
    const assets = await graphToSerialAssetsAsync(config, {
      includeMaps: serializerOptions.includeSourceMaps
    }, ...props);
    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }
    return JSON.stringify(assets);
  };
}
async function graphToSerialAssetsAsync(config, {
  includeMaps
}, ...props) {
  var _config$serializer2, _assetPlugins, _getPlatformOption;
  const [entryFile, preModules, graph, options] = props;
  const cssDeps = (0, _getCssDeps().getCssSerialAssets)(graph.dependencies, {
    projectRoot: options.projectRoot,
    processModuleFilter: options.processModuleFilter
  });

  // Create chunks for splitting.
  const _chunks = new Set();
  [{
    test: (0, _pathToRegexp().default)(entryFile)
  }].map(chunkSettings => gatherChunks(_chunks, chunkSettings, preModules, graph, options, false));

  // console.log('Chunks:');
  // console.log(inspect([..._chunks], { depth: 3, colors: true }));
  // Optimize the chunks
  // dedupeChunks(_chunks);

  const jsAssets = await serializeChunksAsync(_chunks, (_config$serializer2 = config.serializer) !== null && _config$serializer2 !== void 0 ? _config$serializer2 : {}, {
    includeSourceMaps: includeMaps
  });

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
  getFilename() {
    // TODO: Content hash is needed
    return this.options.dev ? this.name : (0, _exportPath().getExportPathForDependencyWithOptions)(this.name, {
      platform: this.getPlatform(),
      serverRoot: this.options.serverRoot
    });
  }
  serializeToCode(serializerConfig) {
    var _serializerConfig$get, _serializerConfig$get2, _getBaseUrlOption;
    const entryFile = this.name;
    const fileName = _path().default.basename(entryFile, '.js');
    const jsSplitBundle = (0, _baseJSBundle().baseJSBundleWithDependencies)(entryFile, [...this.preModules.values()], [...this.deps], {
      ...this.options,
      runBeforeMainModule: (_serializerConfig$get = serializerConfig === null || serializerConfig === void 0 ? void 0 : (_serializerConfig$get2 = serializerConfig.getModulesRunBeforeMainModule) === null || _serializerConfig$get2 === void 0 ? void 0 : _serializerConfig$get2.call(serializerConfig, _path().default.relative(this.options.projectRoot, entryFile))) !== null && _serializerConfig$get !== void 0 ? _serializerConfig$get : [],
      // searchParams.set('modulesOnly', 'true');
      // searchParams.set('runModule', 'false');

      // TODO: Test cases when an async module has global side-effects that should be run.
      // This should be fine as those side-effects would be defined in the module itself, which would be executed upon loading.
      runModule: !this.isAsync,
      modulesOnly: this.preModules.size === 0,
      platform: this.getPlatform(),
      sourceMapUrl: `${fileName}.map`,
      baseUrl: (_getBaseUrlOption = (0, _baseJSBundle().getBaseUrlOption)(this.graph, this.options)) !== null && _getBaseUrlOption !== void 0 ? _getBaseUrlOption : '/',
      splitChunks: (0, _baseJSBundle().getSplitChunksOption)(this.graph, this.options)
    });
    return (0, _bundleToString().default)(jsSplitBundle).code;
  }
  async serializeToAssetsAsync(serializerConfig, {
    includeSourceMaps
  }) {
    const jsCode = this.serializeToCode(serializerConfig);
    const relativeEntry = _path().default.relative(this.options.projectRoot, this.name);
    const outputFile = this.getFilename();
    const jsAsset = {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        isAsync: this.isAsync,
        requires: [...this.requiredChunks.values()].map(chunk => chunk.getFilename())
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
    if (this.isHermesEnabled()) {
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
  isHermesEnabled() {
    var _this$graph$transform;
    // TODO: Revisit.
    // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
    // also create hermes bytecode. We may need to disable in one of the two places.
    return !this.options.dev && this.getPlatform() !== 'web' && ((_this$graph$transform = this.graph.transformOptions.customTransformOptions) === null || _this$graph$transform === void 0 ? void 0 : _this$graph$transform.engine) === 'hermes';
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
    } else {
      // On native, use the preModules in insert code in the entry chunk.
      for (const module of preModules.values()) {
        entryChunk.preModules.add(module);
      }
    }
  }
  const splitChunks = (0, _baseJSBundle().getSplitChunksOption)(graph, options);
  chunks.add(entryChunk);

  // entryChunk.deps.add(entryModule);

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

// function dedupeChunks(chunks: Set<Chunk>) {
//   // Iterate chunks and pull duplicate modules into new common chunks that are required by the original chunks.

//   // We can only de-dupe sync chunks since this would create vendor/shared chunks.
//   const currentChunks = [...chunks.values()].filter((chunk) => !chunk.isAsync);
//   for (const chunk of currentChunks) {
//     const deps = [...chunk.deps.values()];
//     for (const dep of deps) {
//       for (const otherChunk of currentChunks) {
//         if (otherChunk === chunk) {
//           continue;
//         }
//         if (otherChunk.deps.has(dep)) {
//           console.log('found common dep:', dep.path, 'in', chunk.name, 'and', otherChunk.name);
//           // Move the dep into a new chunk.
//           const newChunk = new Chunk(dep.path, dep.path, chunk.graph, chunk.options, false);
//           newChunk.deps.add(dep);
//           chunk.requiredChunks.add(newChunk);
//           otherChunk.requiredChunks.add(newChunk);
//           chunks.add(newChunk);
//           // Remove the dep from the original chunk.
//           chunk.deps.delete(dep);
//           otherChunk.deps.delete(dep);

//           // TODO: Pull all the deps of the dep into the new chunk.
//           for (const depDep of dep.dependencies.values()) {
//             if (depDep.data.data.asyncType === 'async') {
//               gatherChunks(chunks, depDep.absolutePath, [], chunk.graph, chunk.options, false);
//             } else {
//               const module = chunk.graph.dependencies.get(depDep.absolutePath);
//               if (module) {
//                 newChunk.deps.add(module);
//                 if (chunk.deps.has(module)) {
//                   chunk.deps.delete(module);
//                 }
//                 if (otherChunk.deps.has(module)) {
//                   otherChunk.deps.delete(module);
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }

async function serializeChunksAsync(chunks, serializerConfig, {
  includeSourceMaps
}) {
  const jsAssets = [];
  await Promise.all([...chunks].map(async chunk => {
    jsAssets.push(...(await chunk.serializeToAssetsAsync(serializerConfig, {
      includeSourceMaps
    })));
  }));
  return jsAssets;
}
function getSortedModules(modules, {
  createModuleId
}) {
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
//# sourceMappingURL=withExpoSerializers.js.map