"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
exports.getTransformEnvironment = getTransformEnvironment;
exports.replaceEnvironmentVariables = replaceEnvironmentVariables;
exports.serializeWithEnvironmentVariables = serializeWithEnvironmentVariables;
exports.withExpoSerializers = withExpoSerializers;
exports.withSerialProcessors = withSerialProcessors;
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const debug = require('debug')('expo:metro-config:serializer');
function replaceEnvironmentVariables(code, env) {
  // match and replace env variables that aren't NODE_ENV or JEST_WORKER_ID
  // return code.match(/process\.env\.(EXPO_PUBLIC_[A-Z_]+)/g);
  return code.replace(/process\.env\.([a-zA-Z0-9_]+)/gm, match => {
    var _env$name;
    const name = match.replace('process.env.', '');
    if (
    // Must start with EXPO_PUBLIC_ to be replaced
    !/^EXPO_PUBLIC_/.test(name)) {
      return match;
    }
    const value = JSON.stringify((_env$name = env[name]) !== null && _env$name !== void 0 ? _env$name : '');
    debug(`Inlining environment variable "${match}" with ${value}`);
    return value;
  });
}
function getTransformEnvironment(url) {
  const match = url.match(/[&?]transform\.environment=([^&]+)/);
  return match ? match[1] : null;
}
function serializeWithEnvironmentVariables(entryPoint, preModules, graph, options) {
  // Skip replacement in Node.js environments.
  if (options.sourceUrl && getTransformEnvironment(options.sourceUrl) === 'node') {
    debug('Skipping environment variable inlining in Node.js environment.');
    return [entryPoint, preModules, graph, options];
  }

  // Adds about 5ms on a blank Expo Router app.
  // TODO: We can probably cache the results.

  for (const value of graph.dependencies.values()) {
    // Skip node_modules, the feature is a bit too sensitive to allow in arbitrary code.
    if (/node_modules/.test(value.path)) {
      continue;
    }
    for (const index in value.output) {
      // TODO: This probably breaks source maps.
      const code = replaceEnvironmentVariables(value.output[index].data.code, process.env);
      value.output[index].data.code = code;
    }
  }
  return [entryPoint, preModules, graph, options];
}
function withExpoSerializers(config) {
  return withSerialProcessors(config, [serializeWithEnvironmentVariables]);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerialProcessors(config, processors) {
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
function getDefaultSerializer() {
  return (...props) => {
    const bundle = (0, _baseJSBundle().default)(...props);
    return (0, _bundleToString().default)(bundle).code;
  };
}
function createSerializerFromSerialProcessors(processors, serializer) {
  return (...props) => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }
    const finalSerializer = serializer !== null && serializer !== void 0 ? serializer : getDefaultSerializer();
    return finalSerializer(...props);
  };
}
//# sourceMappingURL=serializer.js.map