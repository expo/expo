"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.annotateModule = annotateModule;
exports.createAnnotateModulesSerializerPlugin = createAnnotateModulesSerializerPlugin;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const debug = require('debug')('expo:metro-config:serializer:annotate');
function annotateModule(projectRoot, mod) {
  const filePath = _path().default.relative(projectRoot, mod.path);
  mod.output.forEach(outputItem => {
    // Prevent double annotations
    if (!outputItem.data.code.startsWith('\n// ')) {
      outputItem.data.code = ['', `// ${filePath}`, outputItem.data.code].join('\n');
      if ('lineCount' in outputItem.data && typeof outputItem.data.lineCount === 'number') {
        outputItem.data.lineCount = outputItem.data.lineCount + 2;
      }
      // TODO: Probably need to update sourcemaps here.
    }
  });

  return mod;
}
function createAnnotateModulesSerializerPlugin({
  force
}) {
  return function annotateModulesSerializerPlugin(entryPoint, preModules, graph, options) {
    if (force === false) {
      debug('Annotations have been disabled');
      return [entryPoint, preModules, graph, options];
    }
    if (options.dev || force) {
      debug('Annotating modules with descriptions');
      for (const mod of preModules) {
        annotateModule(options.projectRoot, mod);
      }
      for (const value of graph.dependencies.values()) {
        annotateModule(options.projectRoot, value);
      }
    }
    return [entryPoint, preModules, graph, options];
  };
}
//# sourceMappingURL=annotateModulesSerializerPlugin.js.map