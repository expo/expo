"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;
function _util() {
  const data = require("metro/src/Bundler/util");
  _util = function () {
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
function _getAssets() {
  const data = require("./getAssets");
  _getAssets = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the upstream transformer, but with modifications made for web production hashing.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/utils/assetTransformer.js#L1
 */

async function transform({
  filename,
  options
}, assetRegistryPath, assetDataPlugins) {
  var _options;
  (_options = options) !== null && _options !== void 0 ? _options : options = options || {
    platform: '',
    projectRoot: '',
    inlineRequires: false,
    minify: false
  };
  const absolutePath = _nodePath().default.resolve(options.projectRoot, filename);
  const data = await (0, _getAssets().getUniversalAssetData)(absolutePath, filename, assetDataPlugins, options.platform, options.publicPath);
  return {
    ast: (0, _util().generateAssetCodeFileAst)(assetRegistryPath, data)
  };
}
//# sourceMappingURL=asset-transformer.js.map