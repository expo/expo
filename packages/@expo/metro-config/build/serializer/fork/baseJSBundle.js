"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.baseJSBundle = baseJSBundle;
exports.baseJSBundleWithDependencies = baseJSBundleWithDependencies;
exports.getBaseUrlOption = getBaseUrlOption;
exports.getPlatformOption = getPlatformOption;
exports.getSplitChunksOption = getSplitChunksOption;
function _jscSafeUrl() {
  const data = require("jsc-safe-url");
  _jscSafeUrl = function () {
    return data;
  };
  return data;
}
function _getAppendScripts() {
  const data = _interopRequireDefault(require("metro/src/lib/getAppendScripts"));
  _getAppendScripts = function () {
    return data;
  };
  return data;
}
function _processModules() {
  const data = require("./processModules");
  _processModules = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and better source map support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js#L1
 */

function getPlatformOption(graph, options) {
  var _graph$transformOptio, _url$searchParams$get;
  if (((_graph$transformOptio = graph.transformOptions) === null || _graph$transformOptio === void 0 ? void 0 : _graph$transformOptio.platform) != null) {
    return graph.transformOptions.platform;
  }
  if (!options.sourceUrl) {
    return null;
  }
  const sourceUrl = (0, _jscSafeUrl().isJscSafeUrl)(options.sourceUrl) ? (0, _jscSafeUrl().toNormalUrl)(options.sourceUrl) : options.sourceUrl;
  const url = new URL(sourceUrl, 'https://expo.dev');
  return (_url$searchParams$get = url.searchParams.get('platform')) !== null && _url$searchParams$get !== void 0 ? _url$searchParams$get : null;
}
function getSplitChunksOption(graph, options) {
  // Only enable when the entire bundle is being split, and only run on web.
  return !options.includeAsyncPaths && getPlatformOption(graph, options) === 'web';
}
function getBaseUrlOption(graph, options) {
  var _graph$transformOptio2;
  const baseUrl = (_graph$transformOptio2 = graph.transformOptions.customTransformOptions) === null || _graph$transformOptio2 === void 0 ? void 0 : _graph$transformOptio2.baseUrl;
  if (typeof baseUrl === 'string') {
    // This tells us that the value came over a URL and may be encoded.
    // @ts-expect-error
    const mayBeEncoded = options.serializerOptions == null;
    return mayBeEncoded ? decodeURI(baseUrl) : baseUrl;
  }
  return '/';
}
function baseJSBundle(entryPoint, preModules, graph, options) {
  const platform = getPlatformOption(graph, options);
  if (platform == null) {
    throw new Error('platform could not be determined for Metro bundle');
  }
  return baseJSBundleWithDependencies(entryPoint, preModules, [...graph.dependencies.values()], {
    ...options,
    baseUrl: getBaseUrlOption(graph, options),
    splitChunks: getSplitChunksOption(graph, options),
    platform
  });
}
function baseJSBundleWithDependencies(entryPoint, preModules, dependencies, options) {
  for (const module of dependencies) {
    options.createModuleId(module.path);
  }
  const processModulesOptions = {
    filter: options.processModuleFilter,
    createModuleId: options.createModuleId,
    dev: options.dev,
    includeAsyncPaths: options.includeAsyncPaths,
    projectRoot: options.projectRoot,
    serverRoot: options.serverRoot,
    sourceUrl: options.sourceUrl,
    platform: options.platform,
    baseUrl: options.baseUrl,
    splitChunks: options.splitChunks
  };

  // Do not prepend polyfills or the require runtime when only modules are requested
  if (options.modulesOnly) {
    preModules = [];
  }
  const preCode = (0, _processModules().processModules)(preModules, processModulesOptions).map(([, code]) => code.src).join('\n');
  const modules = [...dependencies].sort((a, b) => options.createModuleId(a.path) - options.createModuleId(b.path));
  const postCode = (0, _processModules().processModules)((0, _getAppendScripts().default)(entryPoint, [...preModules, ...modules], {
    asyncRequireModulePath: options.asyncRequireModulePath,
    createModuleId: options.createModuleId,
    getRunModuleStatement: options.getRunModuleStatement,
    inlineSourceMap: options.inlineSourceMap,
    runBeforeMainModule: options.runBeforeMainModule,
    runModule: options.runModule,
    shouldAddToIgnoreList: options.shouldAddToIgnoreList,
    sourceMapUrl: options.sourceMapUrl,
    sourceUrl: options.sourceUrl
  }), processModulesOptions).map(([, code]) => code.src).join('\n');
  const mods = (0, _processModules().processModules)([...dependencies], processModulesOptions).map(([module, code]) => [options.createModuleId(module.path), code]);
  return {
    pre: preCode,
    post: postCode,
    modules: mods.map(([id, code]) => [id, typeof code === 'number' ? code : code.src]),
    _expoSplitBundlePaths: mods.map(([id, code]) => [id, typeof code === 'number' ? {} : code.paths])
  };
}
//# sourceMappingURL=baseJSBundle.js.map