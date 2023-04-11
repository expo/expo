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
function _countLines() {
  const data = _interopRequireDefault(require("metro/src/lib/countLines"));
  _countLines = function () {
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
  const data = require("./env");
  _env = function () {
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
function _css() {
  const data = require("./transform-worker/css");
  _css = function () {
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
function serializeWithEnvironmentVariables(entryPoint, preModules, graph, options) {
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
  return {
    dependencies: new Map(),
    getSource: () => Buffer.from(code),
    inverseDependencies: new Set(),
    path: name,
    output: [{
      type: 'js/script/virtual',
      data: {
        code,
        lineCount: (0, _countLines().default)(code),
        map: []
      }
    }]
  };
}
function withExpoSerializers(config) {
  const processors = [];
  if (!_env().env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(serializeWithEnvironmentVariables);
  }
  return withSerialProcessors(config, processors);
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
    var _props$3$sourceUrl;
    const bundle = (0, _baseJSBundle().default)(...props);
    if (!((_props$3$sourceUrl = props[3].sourceUrl) !== null && _props$3$sourceUrl !== void 0 && _props$3$sourceUrl.includes('&_type=html'))) {
      // Default behavior if `_type=html` is not present in the URL.
      return (0, _bundleToString().default)(bundle).code;
    }
    const cssDeps = (0, _getCssDeps().getCssModules)(props[2].dependencies, {
      projectRoot: props[3].projectRoot,
      processModuleFilter: props[3].processModuleFilter
    });
    // Combine the CSS modules into tags that have hot refresh data attributes.
    const styleString = cssDeps.map(([ipath, content]) => {
      // TODO: No data id in prod
      return `<style data-expo-css-hmr="${(0, _css().pathToHtmlSafeName)(_path().default.relative(props[3].projectRoot, ipath))}">` + content + '\n</style>';
    }).join('');
    const url = props[3].sourceUrl.replace('&_type=html', '')
    // Hack to make the path relative to the dev server.
    .replace('http://192.168.1.118:19000', '');
    // Fast refresh only appears to work if we include a script with a URL.
    // Possibly https://github.com/expo/router/blob/348a352e031ac46e4f1f29b0f0dc0d609454e1c4/packages/expo-router/src/getDevServer/index.ts#L20
    const script = `<script src="${url}"></script>`;
    // const script = '<script>' + bundleToString(bundle).code + '\n</script>';

    // TODO: Render this statically
    return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover">
    <style data-id="expo-reset">#root,body{display:flex}#root,body,html{width:100%;-webkit-overflow-scrolling:touch;margin:0;padding:0;min-height:100%}#root{flex-shrink:0;flex-basis:auto;flex-grow:1;flex:1}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;height:calc(100% + env(safe-area-inset-top))}body{overflow-y:auto;overscroll-behavior-y:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-ms-overflow-style:scrollbar}</style>
      ${styleString}
      </head>
      <body>
      <div id="root"></div>
      ${script}
      </body>`;
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