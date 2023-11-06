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
exports.getDefaultSerializer = getDefaultSerializer;
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
function _environmentVariableSerializerPlugin() {
  const data = require("./environmentVariableSerializerPlugin");
  _environmentVariableSerializerPlugin = function () {
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
function _js() {
  const data = require("./fork/js");
  _js = function () {
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
  var _config$serializer, _config$serializer2;
  const originalSerializer = (_config$serializer = config.serializer) === null || _config$serializer === void 0 ? void 0 : _config$serializer.customSerializer;
  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors( // @ts-expect-error
      (_config$serializer2 = config.serializer) !== null && _config$serializer2 !== void 0 ? _config$serializer2 : {}, processors, originalSerializer)
    }
  };
}
function getDefaultSerializer(serializerConfig, fallbackSerializer) {
  const defaultSerializer = fallbackSerializer !== null && fallbackSerializer !== void 0 ? fallbackSerializer : async (...params) => {
    const bundle = (0, _baseJSBundle().baseJSBundle)(...params);
    const outputCode = (0, _bundleToString().default)(bundle).code;
    return outputCode;
  };
  return async (...props) => {
    var _chunks$map;
    const [entryFile, preModules, graph, options] = props;

    // const jsCode = await defaultSerializer(entryFile, preModules, graph, options);

    // toFixture(...props);
    if (!options.sourceUrl) {
      return defaultSerializer(...props);
    }
    const sourceUrl = (0, _jscSafeUrl().isJscSafeUrl)(options.sourceUrl) ? (0, _jscSafeUrl().toNormalUrl)(options.sourceUrl) : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');
    if (!graph.transformOptions.platform) {
      // @ts-expect-error
      graph.transformOptions.platform = url.searchParams.get('platform');
    }
    if (graph.transformOptions.platform !== 'web' || url.searchParams.get('serializer.output') !== 'static') {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return defaultSerializer(...props);
    }
    const chunks = url.searchParams.has('serializer.chunks') ? JSON.parse(url.searchParams.get('serializer.chunks')) : null;
    const allEntryFiles = new Set([
    // Entry file for all chunks.
    entryFile,
    // Entry files for each chunk.
    ...((_chunks$map = chunks === null || chunks === void 0 ? void 0 : chunks.map(chunk => chunk.inputs)) !== null && _chunks$map !== void 0 ? _chunks$map : []).flat()]);
    console.log('process chunks:', entryFile, chunks, allEntryFiles);
    const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';
    const cssDeps = (0, _getCssDeps().getCssSerialAssets)(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter
    });

    // JS

    const _chunks = gatherChunks(new Set(), entryFile, preModules, graph, options);

    // Optimize the chunks
    dedupeChunks(_chunks);
    const jsAssets = serializeChunks(_chunks, serializerConfig);
    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}
class Chunk {
  // Chunks that are required to be loaded synchronously before this chunk.
  // These are included in the HTML as <script> tags.

  constructor(name, entry, graph, options, isAsync = false) {
    this.name = name;
    this.entry = entry;
    this.graph = graph;
    this.options = options;
    this.isAsync = isAsync;
    _defineProperty(this, "deps", new Set());
    _defineProperty(this, "preModules", new Set());
    _defineProperty(this, "requiredChunks", new Set());
  }
  getFilename() {
    (0, _assert().default)(this.graph.transformOptions.platform, "platform is required to be in graph's transformOptions");
    // TODO: Content hash is needed
    return this.options.dev ? this.entry : (0, _js().getExportPathForDependencyWithOptions)(this.entry, {
      platform: this.graph.transformOptions.platform,
      serverRoot: this.options.serverRoot
    });
  }
  serializeToCode(serializerConfig) {
    const entryFile = this.entry;
    const fileName = _path().default.basename(entryFile, '.js');
    const jsSplitBundle = (0, _baseJSBundle().baseJSBundleWithDependencies)(entryFile, [...this.preModules.values()], [...this.deps], {
      ...this.options,
      runBeforeMainModule: serializerConfig.getModulesRunBeforeMainModule(_path().default.relative(this.options.projectRoot, entryFile)),
      // ...(entryFile === '[vendor]'
      //   ? {
      //       runModule: false,
      //       modulesOnly: true,
      //       runBeforeMainModule: [],
      //     }
      //   : {}),
      sourceMapUrl: `${fileName}.js.map`
    });
    return (0, _bundleToString().default)(jsSplitBundle).code;
  }
  serializeToAsset(serializerConfig) {
    const jsCode = this.serializeToCode(serializerConfig);

    // console.log('-- code:', jsCode);
    // // Save sourcemap
    // const getSortedModules = (graph) => {
    //   return [...graph.dependencies.values()].sort(
    //     (a, b) => options.createModuleId(a.path) - options.createModuleId(b.path)
    //   );
    // };
    // const sourceMapString = require('metro/src/DeltaBundler/Serializers/sourceMapString');

    // const sourceMap = sourceMapString([...prependInner, ...getSortedModules(graph)], {
    //   // excludeSource: options.excludeSource,
    //   processModuleFilter: options.processModuleFilter,
    //   shouldAddToIgnoreList: options.shouldAddToIgnoreList,
    //   // excludeSource: options.excludeSource,
    // });

    // await writeFile(outputOpts.sourceMapOutput, sourceMap, null);

    // console.log('entry >', entryDependency, entryDependency.dependencies);
    const relativeEntry = _path().default.relative(this.options.projectRoot, this.entry);
    const outputFile = this.getFilename();
    return {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        requires: [...this.requiredChunks.values()].map(chunk => chunk.getFilename())
      },
      source: jsCode
    };
  }
}
function gatherChunks(chunks, entryFile, preModules, graph, options, isAsync = false) {
  const entryModule = graph.dependencies.get(entryFile);
  if (!entryModule) {
    throw new Error('Entry module not found in graph: ' + entryFile);
  }

  // Prevent processing the same entry file twice.
  if ([...chunks.values()].find(chunk => chunk.entry === entryFile)) {
    return chunks;
  }
  const entryChunk = new Chunk(entryFile, entryFile, graph, options, isAsync);

  // Add all the pre-modules to the first chunk.
  if (preModules.length) {
    if (graph.transformOptions.platform === 'web' && !isAsync) {
      // On web, add a new required chunk that will be included in the HTML.
      const preChunk = new Chunk('__premodules__', '__premodules__', graph, options);
      for (const module of preModules.values()) {
        preChunk.deps.add(module);
      }
      chunks.add(preChunk);
      entryChunk.requiredChunks.add(preChunk);
    } else {
      // On native, use the preModules in insert code in the entry chunk.
      for (const module of preModules.values()) {
        entryChunk.preModules.add(module);
      }
    }
  }
  chunks.add(entryChunk);
  entryChunk.deps.add(entryModule);
  for (const dependency of entryModule.dependencies.values()) {
    if (dependency.data.data.asyncType === 'async') {
      gatherChunks(chunks, dependency.absolutePath, [], graph, options, true);
    } else {
      const module = graph.dependencies.get(dependency.absolutePath);
      if (module) {
        entryChunk.deps.add(module);
      }
    }
  }
  return chunks;
}
function dedupeChunks(chunks) {
  // Iterate chunks and pull duplicate modules into new common chunks that are required by the original chunks.

  // We can only de-dupe sync chunks since this would create vendor/shared chunks.
  const currentChunks = [...chunks.values()].filter(chunk => !chunk.isAsync);
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
            } else {
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
function serializeChunks(chunks, serializerConfig) {
  const jsAssets = [];
  chunks.forEach(chunk => {
    jsAssets.push(chunk.serializeToAsset(serializerConfig));
  });
  return jsAssets;
}
function getSortedModules(graph, {
  createModuleId
}) {
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
  const modules = [...prepend, ...getSortedModules(graph, {
    createModuleId: options.createModuleId
  })];
  return (0, _sourceMapString().default)(modules, {
    ...options
  });
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer) {
  const finalSerializer = getDefaultSerializer(config, originalSerializer);
  return (...props) => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }
    return finalSerializer(...props);
  };
}

// __d((function(g,r,i,a,m,e,d){}),435,{"0":2,"1":18,"2":184,"3":103,"4":436,"5":438,"6":439,"paths":{"438":"/etc/external.bundle?platform=web"}});
//# sourceMappingURL=withExpoSerializers.js.map