"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.environmentVariableSerializerPlugin = environmentVariableSerializerPlugin;
exports.getTransformEnvironment = getTransformEnvironment;
exports.replaceEnvironmentVariables = replaceEnvironmentVariables;
function _CountingSet() {
  const data = _interopRequireDefault(require("metro/src/lib/CountingSet"));
  _CountingSet = function () {
    return data;
  };
  return data;
}
function _countLines() {
  const data = _interopRequireDefault(require("metro/src/lib/countLines"));
  _countLines = function () {
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

const debug = require('debug')('expo:metro-config:serializer:env-var');
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
function getAllExpoPublicEnvVars() {
  // Create an object containing all environment variables that start with EXPO_PUBLIC_
  const env = {};
  for (const key in process.env) {
    if (key.startsWith('EXPO_PUBLIC_')) {
      // @ts-ignore
      env[key] = process.env[key];
    }
  }
  return env;
}
function environmentVariableSerializerPlugin(entryPoint, preModules, graph, options) {
  // Skip replacement in Node.js environments.
  if (options.sourceUrl && getTransformEnvironment(options.sourceUrl) === 'node') {
    debug('Skipping environment variable inlining in Node.js environment.');
    return [entryPoint, preModules, graph, options];
  }

  // Adds about 5ms on a blank Expo Router app.
  // TODO: We can probably cache the results.

  // In development, we need to add the process.env object to ensure it
  // persists between Fast Refresh updates.
  if (options.dev) {
    // Set the process.env object to the current environment variables object
    // ensuring they aren't iterable, settable, or enumerable.
    const str = `process.env=Object.defineProperties(process.env, {${Object.keys(getAllExpoPublicEnvVars()).map(key => `${JSON.stringify(key)}: { value: ${JSON.stringify(process.env[key])} }`).join(',')}});`;
    const [firstModule, ...restModules] = preModules;
    // const envCode = `var process=this.process||{};${str}`;
    // process.env
    return [entryPoint, [
    // First module defines the process.env object.
    firstModule,
    // Second module modifies the process.env object.
    getEnvPrelude(str),
    // Now we add the rest
    ...restModules], graph, options];
  }

  // In production, inline all process.env variables to ensure they cannot be iterated and read arbitrarily.
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
function getEnvPrelude(contents) {
  const code = '// HMR env vars from Expo CLI (dev-only)\n' + contents;
  const name = '__env__';
  const lineCount = (0, _countLines().default)(code);
  return {
    dependencies: new Map(),
    getSource: () => Buffer.from(code),
    inverseDependencies: new (_CountingSet().default)(),
    path: name,
    output: [{
      type: 'js/script/virtual',
      data: {
        code,
        // @ts-expect-error: typed incorrectly upstream
        lineCount,
        map: []
      }
    }]
  };
}
//# sourceMappingURL=environmentVariableSerializerPlugin.js.map