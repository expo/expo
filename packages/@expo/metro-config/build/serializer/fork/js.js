"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getJsOutput = getJsOutput;
exports.getModuleParams = getModuleParams;
exports.isJsModule = isJsModule;
exports.isJsOutput = isJsOutput;
exports.wrapModule = wrapModule;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _jscSafeUrl() {
  const data = _interopRequireDefault(require("jsc-safe-url"));
  _jscSafeUrl = function () {
    return data;
  };
  return data;
}
function _metroTransformPlugins() {
  const data = require("metro-transform-plugins");
  _metroTransformPlugins = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the metro helper, but with bundle splitting support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/helpers/js.js#L1
 */

function wrapModule(module, options) {
  const output = getJsOutput(module);
  if (output.type.startsWith('js/script')) {
    return {
      src: output.data.code,
      paths: {}
    };
  }
  const {
    params,
    paths
  } = getModuleParams(module, options);
  let src = output.data.code;
  if (!options.skipWrapping) {
    src = (0, _metroTransformPlugins().addParamsToDefineCall)(output.data.code, ...params);
  }
  return {
    src,
    paths
  };
}
function getModuleParams(module, options) {
  const moduleId = options.createModuleId(module.path);
  const paths = {};
  let hasPaths = false;
  const dependencyMapArray = Array.from(module.dependencies.values()).map(dependency => {
    const id = options.createModuleId(dependency.absolutePath);
    if (
    // NOTE(EvanBacon): Disabled this to ensure that paths are provided even when the entire bundle
    // is created. This is required for production bundle splitting.
    // options.includeAsyncPaths &&

    dependency.data.data.asyncType != null) {
      if (options.includeAsyncPaths) {
        if (options.sourceUrl) {
          hasPaths = true;
          // TODO: Only include path if the target is not in the bundle

          // Construct a server-relative URL for the split bundle, propagating
          // most parameters from the main bundle's URL.

          const {
            searchParams
          } = new URL(_jscSafeUrl().default.toNormalUrl(options.sourceUrl));
          searchParams.set('modulesOnly', 'true');
          searchParams.set('runModule', 'false');
          const bundlePath = _path().default.relative(options.serverRoot, dependency.absolutePath);
          paths[id] = '/' + _path().default.join(_path().default.dirname(bundlePath),
          // Strip the file extension
          _path().default.basename(bundlePath, _path().default.extname(bundlePath))) + '.bundle?' + searchParams.toString();
        }
      } else if (options.splitChunks && options.computedAsyncModulePaths != null) {
        hasPaths = true;
        // A template string that we'll match and replace later when we know the content hash for a given path.
        paths[id] = options.computedAsyncModulePaths[dependency.absolutePath];
      }
    }
    return id;
  });
  const params = [moduleId, hasPaths ? {
    ...dependencyMapArray,
    paths
  } : dependencyMapArray];
  if (options.dev) {
    // Add the relative path of the module to make debugging easier.
    // This is mapped to `module.verboseName` in `require.js`.
    params.push(_path().default.relative(options.projectRoot, module.path));
  }
  return {
    params,
    paths
  };
}
function getJsOutput(module) {
  var _module$path, _module$path2;
  const jsModules = module.output.filter(({
    type
  }) => type.startsWith('js/'));
  (0, _assert().default)(jsModules.length === 1, `Modules must have exactly one JS output, but ${(_module$path = module.path) !== null && _module$path !== void 0 ? _module$path : 'unknown module'} has ${jsModules.length} JS outputs.`);
  const jsOutput = jsModules[0];
  (0, _assert().default)(Number.isFinite(jsOutput.data.lineCount), `JS output must populate lineCount, but ${(_module$path2 = module.path) !== null && _module$path2 !== void 0 ? _module$path2 : 'unknown module'} has ${jsOutput.type} output with lineCount '${jsOutput.data.lineCount}'`);
  return jsOutput;
}
function isJsModule(module) {
  return module.output.filter(isJsOutput).length > 0;
}
function isJsOutput(output) {
  return output.type.startsWith('js/');
}
//# sourceMappingURL=js.js.map