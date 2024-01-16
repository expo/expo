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
exports.createDefaultExportCustomSerializer = createDefaultExportCustomSerializer;
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
exports.withExpoSerializers = withExpoSerializers;
exports.withSerializerPlugins = withSerializerPlugins;
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
function _debugId() {
  const data = require("./debugId");
  _debugId = function () {
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
function _serializeChunks() {
  const data = require("./serializeChunks");
  _serializeChunks = function () {
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
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function withExpoSerializers(config, options = {}) {
  const processors = [];
  processors.push(_environmentVariableSerializerPlugin().serverPreludeSerializerPlugin);
  if (!_env().env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(_environmentVariableSerializerPlugin().environmentVariableSerializerPlugin);
  }
  return withSerializerPlugins(config, processors, options);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors, options = {}) {
  var _config$serializer;
  const originalSerializer = (_config$serializer = config.serializer) === null || _config$serializer === void 0 ? void 0 : _config$serializer.customSerializer;
  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(config, processors, originalSerializer !== null && originalSerializer !== void 0 ? originalSerializer : null, options)
    }
  };
}
function createDefaultExportCustomSerializer(config, configOptions = {}) {
  return async (entryPoint, preModules, graph, options) => {
    var _config$serializer2;
    const isPossiblyDev = graph.transformOptions.hot;
    // TODO: This is a temporary solution until we've converged on using the new serializer everywhere.
    const enableDebugId = options.inlineSourceMap !== true && !isPossiblyDev;
    let debugId;
    const loadDebugId = () => {
      if (!enableDebugId || debugId) {
        return debugId;
      }

      // TODO: Perform this cheaper.
      const bundle = (0, _baseJSBundle().baseJSBundle)(entryPoint, preModules, graph, {
        ...options,
        debugId: undefined
      });
      const outputCode = (0, _bundleToString().default)(bundle).code;
      debugId = (0, _debugId().stringToUUID)(outputCode);
      return debugId;
    };
    let premodulesToBundle = [...preModules];
    let bundleCode = null;
    let bundleMap = null;
    if ((_config$serializer2 = config.serializer) !== null && _config$serializer2 !== void 0 && _config$serializer2.customSerializer) {
      var _config$serializer3;
      const bundle = await ((_config$serializer3 = config.serializer) === null || _config$serializer3 === void 0 ? void 0 : _config$serializer3.customSerializer(entryPoint, premodulesToBundle, graph, options));
      if (typeof bundle === 'string') {
        bundleCode = bundle;
      } else {
        bundleCode = bundle.code;
        bundleMap = bundle.map;
      }
    } else {
      const debugId = loadDebugId();
      if (configOptions.unstable_beforeAssetSerializationPlugins) {
        for (const plugin of configOptions.unstable_beforeAssetSerializationPlugins) {
          premodulesToBundle = plugin({
            graph,
            premodules: [...premodulesToBundle],
            debugId
          });
        }
      }
      bundleCode = (0, _bundleToString().default)((0, _baseJSBundle().baseJSBundle)(entryPoint, premodulesToBundle, graph, {
        ...options,
        debugId
      })).code;
    }
    if (isPossiblyDev) {
      if (bundleMap == null) {
        return bundleCode;
      }
      return {
        code: bundleCode,
        map: bundleMap
      };
    }

    // Exports....

    if (!bundleMap) {
      bundleMap = (0, _sourceMapString().default)([...premodulesToBundle, ...(0, _serializeChunks().getSortedModules)([...graph.dependencies.values()], options)], {
        // TODO: Surface this somehow.
        excludeSource: false,
        // excludeSource: options.serializerOptions?.excludeSource,
        processModuleFilter: options.processModuleFilter,
        shouldAddToIgnoreList: options.shouldAddToIgnoreList
      });
    }
    if (enableDebugId) {
      const mutateSourceMapWithDebugId = sourceMap => {
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
        map: mutateSourceMapWithDebugId(bundleMap)
      };
    }
    return {
      code: bundleCode,
      map: bundleMap
    };
  };
}
function getDefaultSerializer(config, fallbackSerializer, configOptions = {}) {
  const defaultSerializer = fallbackSerializer !== null && fallbackSerializer !== void 0 ? fallbackSerializer : createDefaultExportCustomSerializer(config, configOptions);
  return async (...props) => {
    const [,,, options] = props;
    const customSerializerOptions = options.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!(customSerializerOptions !== null && customSerializerOptions !== void 0 && customSerializerOptions.output);
    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          includeBytecode: customSerializerOptions.includeBytecode,
          outputMode: customSerializerOptions.output,
          includeSourceMaps: customSerializerOptions.includeSourceMaps
        };
      }
      if (options.sourceUrl) {
        const sourceUrl = (0, _jscSafeUrl().isJscSafeUrl)(options.sourceUrl) ? (0, _jscSafeUrl().toNormalUrl)(options.sourceUrl) : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        return {
          outputMode: url.searchParams.get('serializer.output'),
          includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
          includeBytecode: url.searchParams.get('serializer.bytecode') === 'true'
        };
      }
      return null;
    })();
    if ((serializerOptions === null || serializerOptions === void 0 ? void 0 : serializerOptions.outputMode) !== 'static') {
      return defaultSerializer(...props);
    }

    // Mutate the serializer options with the parsed options.
    options.serializerOptions = {
      ...options.serializerOptions,
      ...serializerOptions
    };
    const assets = await (0, _serializeChunks().graphToSerialAssetsAsync)(config, {
      includeSourceMaps: !!serializerOptions.includeSourceMaps,
      includeBytecode: !!serializerOptions.includeBytecode,
      ...configOptions
    }, ...props);
    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }
    return JSON.stringify(assets);
  };
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer, options = {}) {
  const finalSerializer = getDefaultSerializer(config, originalSerializer, options);
  return (...props) => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }
    return finalSerializer(...props);
  };
}
//# sourceMappingURL=withExpoSerializers.js.map