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
    // TODO: Anything...
    return defaultSerializer(...props);
  };
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