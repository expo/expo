"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.baseJSBundle = baseJSBundle;
exports.baseJSBundleWithDependencies = baseJSBundleWithDependencies;
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
 */

// @ts-expect-error

function baseJSBundle(entryPoint, preModules, graph, options) {
  return baseJSBundleWithDependencies(entryPoint, preModules, [...graph.dependencies.values()], options);
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
    sourceUrl: options.sourceUrl
  };

  // Do not prepend polyfills or the require runtime when only modules are requested
  if (options.modulesOnly) {
    preModules = [];
  }
  const preCode = (0, _processModules().processModules)(preModules, processModulesOptions).map(([_, code]) => code.src).join('\n');
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
  }), processModulesOptions).map(([_, code]) => code.src).join('\n');
  const mods = (0, _processModules().processModules)([...dependencies], processModulesOptions).map(([module, code]) => [options.createModuleId(module.path), code]);
  return {
    pre: preCode,
    post: postCode,
    modules: mods.map(([id, code]) => [id, typeof code === 'number' ? code : code.src]),
    _expoSplitBundlePaths: mods.map(([id, code]) => [id, typeof code === 'number' ? {} : code.paths])
  };
}
//# sourceMappingURL=baseJSBundle.js.map