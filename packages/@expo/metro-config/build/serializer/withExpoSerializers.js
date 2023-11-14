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
function _bundleToString() {
  const data = _interopRequireDefault(require("metro/src/lib/bundleToString"));
  _bundleToString = function () {
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
    const [,,, options] = props;

    // @ts-expect-error
    const customSerializerOptions = options.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!(customSerializerOptions !== null && customSerializerOptions !== void 0 && customSerializerOptions.output);
    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          includeBytecode: customSerializerOptions.includeBytecode,
          outputMode: customSerializerOptions.output,
          includeSourceMaps: customSerializerOptions.includeMaps
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
    const assets = await (0, _serializeChunks().graphToSerialAssetsAsync)(config, {
      includeSourceMaps: serializerOptions.includeSourceMaps,
      includeBytecode: serializerOptions.includeBytecode
    }, ...props);
    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }
    return JSON.stringify(assets);
  };
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