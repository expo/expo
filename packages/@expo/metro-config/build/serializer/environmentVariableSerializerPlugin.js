"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.environmentVariableSerializerPlugin = environmentVariableSerializerPlugin;
exports.getTransformEnvironment = getTransformEnvironment;
exports.serverPreludeSerializerPlugin = serverPreludeSerializerPlugin;
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
function isServerEnvironment(graph, options) {
  // Requests from a dev server will use sourceUrl.
  if (!graph.transformOptions.customTransformOptions) {
    if (options.sourceUrl) {
      const env = getTransformEnvironment(options.sourceUrl);
      return env === 'node';
    }
    return false;
  }

  // Other requests will use customTransformOptions.environment.
  return graph.transformOptions.customTransformOptions.environment === 'node';
}

/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
function serverPreludeSerializerPlugin(entryPoint, preModules, graph, options) {
  if (isServerEnvironment(graph, options)) {
    const prelude = preModules.find(module => module.path === '__prelude__');
    if (prelude) {
      debug('Stripping environment variable polyfill in server environment.');
      prelude.output[0].data.code = prelude.output[0].data.code.replace(/process=this\.process\|\|{},/, '').replace(/process\.env=process\.env\|\|{};process\.env\.NODE_ENV=process\.env\.NODE_ENV\|\|"\w+";/, '');
    }
  }
  return [entryPoint, preModules, graph, options];
}
function environmentVariableSerializerPlugin(entryPoint, preModules, graph, options) {
  // Skip replacement in Node.js environments.
  if (isServerEnvironment(graph, options)) {
    debug('Skipping environment variable inlining in Node.js environment.');
    return [entryPoint, preModules, graph, options];
  }

  // In development, we need to add the process.env object to ensure it
  // persists between Fast Refresh updates.
  if (!options.dev) {
    debug('Skipping environment variable inlining in production environment in favor of babel-preset-expo inlining with source maps.');
    return [entryPoint, preModules, graph, options];
  }

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