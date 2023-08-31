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
exports.withExpoSerializers = withExpoSerializers;
exports.withSerializerPlugins = withSerializerPlugins;
function _jscSafeUrl() {
  const data = require("jsc-safe-url");
  _jscSafeUrl = function () {
    return data;
  };
  return data;
}
function _baseJSBundle() {
  const data = _interopRequireDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
  _baseJSBundle = function () {
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
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-expect-error

function withExpoSerializers(config) {
  const processors = [];
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
      customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer)
    }
  };
}
function getDefaultSerializer(fallbackSerializer) {
  const defaultSerializer = fallbackSerializer !== null && fallbackSerializer !== void 0 ? fallbackSerializer : async (...params) => {
    const bundle = (0, _baseJSBundle().default)(...params);
    const outputCode = (0, _bundleToString().default)(bundle).code;
    return outputCode;
  };
  return async (...props) => {
    const [entryPoint, preModules, graph, options] = props;
    const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);
    if (!options.sourceUrl) {
      return jsCode;
    }
    const sourceUrl = (0, _jscSafeUrl().isJscSafeUrl)(options.sourceUrl) ? (0, _jscSafeUrl().toNormalUrl)(options.sourceUrl) : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');
    if (url.searchParams.get('platform') !== 'web' || url.searchParams.get('serializer.output') !== 'static') {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return jsCode;
    }
    const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';
    const cssDeps = (0, _getCssDeps().getCssSerialAssets)(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter
    });
    const jsAssets = [];
    if (jsCode) {
      const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      const jsFilename = (0, _getCssDeps().fileNameFromContents)({
        filepath: url.pathname,
        src: stringContents
      });
      jsAssets.push({
        filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents
      });
      if (
      // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
      includeSourceMaps && options.sourceMapUrl) {
        const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        const parsed = JSON.parse(sourceMap);
        // TODO: Maybe we can do this earlier.
        parsed.sources = parsed.sources.map(
        // TODO: Maybe basePath support
        value => {
          if (value.startsWith('/')) {
            var _options$serverRoot;
            return '/' + _path().default.relative((_options$serverRoot = options.serverRoot) !== null && _options$serverRoot !== void 0 ? _options$serverRoot : options.projectRoot, value);
          }
          // Prevent `__prelude__` from being relative.
          return value;
        });
        jsAssets.push({
          filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
          originFilename: 'index.map',
          type: 'map',
          metadata: {},
          source: JSON.stringify(parsed)
        });
      }
    }
    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
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
function createSerializerFromSerialProcessors(processors, originalSerializer) {
  const finalSerializer = getDefaultSerializer(originalSerializer);
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