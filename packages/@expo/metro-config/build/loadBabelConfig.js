"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadBabelConfig = void 0;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
const loadBabelConfig = function () {
  let babelRC = null;
  return function _getBabelRC({
    projectRoot
  }) {
    if (babelRC !== null) {
      return babelRC;
    }
    babelRC = {};
    if (projectRoot) {
      // Check for various babel config files in the project root
      // TODO(EvanBacon): We might want to disable babelrc lookup when the user specifies `enableBabelRCLookup: false`.
      const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];
      const foundBabelRCPath = possibleBabelRCPaths.find(configFileName => _nodeFs().default.existsSync(_nodePath().default.resolve(projectRoot, configFileName)));

      // Extend the config if a babel config file is found
      if (foundBabelRCPath) {
        babelRC.extends = _nodePath().default.resolve(projectRoot, foundBabelRCPath);
      }
    }

    // Use the default preset for react-native if no babel config file is found
    if (!babelRC.extends) {
      babelRC.presets = [require('babel-preset-expo')];
    }
    return babelRC;
  };
}();
exports.loadBabelConfig = loadBabelConfig;
//# sourceMappingURL=loadBabelConfig.js.map