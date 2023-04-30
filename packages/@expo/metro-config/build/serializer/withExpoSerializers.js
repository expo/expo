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
function _env() {
  const data = require("../env");
  _env = function () {
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
    // excludeSource: options.excludeSource,
    processModuleFilter: options.processModuleFilter
  });
}
function getDefaultSerializer(fallbackSerializer) {
  const defaultSerializer = fallbackSerializer !== null && fallbackSerializer !== void 0 ? fallbackSerializer : (...params) => {
    const bundle = (0, _baseJSBundle().default)(...params);
    return (0, _bundleToString().default)(bundle).code;
  };
  return (...props) => {
    const [,, graph, options] = props;
    const parsedOptions = {
      ...props[3]
    };
    const optionalSourceUrl = options.sourceUrl ? new URL(options.sourceUrl, 'https://expo.dev') : null;

    // Expose sourcemap control with a query param.
    const sourceMapQueryParam = optionalSourceUrl ? getSourceMapOption(optionalSourceUrl) : null;
    if (sourceMapQueryParam != null) {
      // Sync the options with the query parameter.
      if (sourceMapQueryParam === 'inline') {
        parsedOptions.inlineSourceMap = true;
      } else if (sourceMapQueryParam === false) {
        parsedOptions.inlineSourceMap = false;
        parsedOptions.sourceUrl = null;
      }
    }

    // Fully parse this tragedy option.
    const sourceMapOption = sourceMapQueryParam != null ? sourceMapQueryParam : parsedOptions.inlineSourceMap ? 'inline' : !!parsedOptions.sourceMapUrl;
    const isWeb = (optionalSourceUrl === null || optionalSourceUrl === void 0 ? void 0 : optionalSourceUrl.searchParams.get('platform')) === 'web';
    if (isWeb && optionalSourceUrl) {
      // relativize sourceUrl
      let pathWithQuery = optionalSourceUrl.pathname;
      let sourcemapPathWithQuery = '';
      // Use `.js` on web.
      if (pathWithQuery.endsWith('.bundle')) {
        pathWithQuery = pathWithQuery.slice(0, -'.bundle'.length);
        pathWithQuery += '.js';
      }
      sourcemapPathWithQuery = pathWithQuery + '.map';
      // Attach query (possibly not needed).
      if (optionalSourceUrl.search) {
        pathWithQuery += optionalSourceUrl.search;
        sourcemapPathWithQuery += optionalSourceUrl.search;
      }
      parsedOptions.sourceUrl = pathWithQuery;
      if (sourceMapOption === true) {
        parsedOptions.sourceMapUrl = sourcemapPathWithQuery;
      }
    }
    const jsCode = defaultSerializer(props[0], props[1], props[2], parsedOptions);
    const url = optionalSourceUrl;
    if (!url || url.searchParams.get('platform') !== 'web' || url.searchParams.get('serializer.output') !== 'static') {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return jsCode;
    }
    const cssDeps = (0, _getCssDeps().getCssSerialAssets)(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter
    });
    const jsAsset = [];
    if (jsCode) {
      let stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
      const hashedFileName = (0, _getCssDeps().fileNameFromContents)({
        filepath: url.pathname,
        src: stringContents
      });
      const jsFilename = options.dev ? 'index.js' : `_expo/static/js/web/${hashedFileName}.js`;
      let sourceMap = null;
      if (sourceMapOption !== false) {
        sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(props[0], props[1], props[2], parsedOptions) : jsCode.map;

        // Make all paths relative to the project root
        const parsed = JSON.parse(sourceMap);
        parsed.sources = parsed.sources.map(value => '/' + _path().default.relative(options.projectRoot, value));
        sourceMap = JSON.stringify(parsed);
        const sourcemapFilename = options.dev ? 'index.js.map' : `_expo/static/js/web/${hashedFileName}.js.map`;
        jsAsset.push({
          filename: sourcemapFilename,
          originFilename: 'index.js.map',
          type: 'map',
          metadata: {},
          source: sourceMap
        });
        if (!options.dev) {
          // Replace existing sourceMappingURL comments if they exist
          stringContents = stringContents.replace(/^\/\/# sourceMappingURL=.*/m, `//# sourceMappingURL=/${sourcemapFilename}`);
          stringContents = stringContents.replace(/^\/\/# sourceURL=.*/m, `//# sourceURL=/${jsFilename}`);
        }
      } else {
        // TODO: Remove this earlier, using some built-in metro system.
        // Remove any sourceMappingURL and sourceURL comments
        stringContents = stringContents.replace(/^\/\/# sourceMappingURL=.*/gm, '');
        stringContents = stringContents.replace(/^\/\/# sourceURL=.*/gm, '');
      }
      jsAsset.push({
        filename: jsFilename,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: stringContents
      });
    }
    return JSON.stringify([...jsAsset, ...cssDeps]);
  };
}
function getSourceMapOption(url) {
  const sourcemapQueryParam = url.searchParams.get('serializer.sourcemap');
  if (sourcemapQueryParam) {
    if (!['true', 'false', 'inline'].includes(sourcemapQueryParam)) {
      throw new Error(`Invalid value for 'serializer.sourcemap' query parameter: ${sourcemapQueryParam}. Expected one of: true, false, inline.`);
    } else if (sourcemapQueryParam === 'inline') {
      return sourcemapQueryParam;
    }
    return sourcemapQueryParam === 'true';
  }
  return null;
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