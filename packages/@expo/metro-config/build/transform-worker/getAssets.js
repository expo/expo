"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getAssets;
exports.getUniversalAssetData = getUniversalAssetData;
function _Assets() {
  const data = require("metro/src/Assets");
  _Assets = function () {
    return data;
  };
  return data;
}
function _js() {
  const data = require("metro/src/DeltaBundler/Serializers/helpers/js");
  _js = function () {
    return data;
  };
  return data;
}
function _nodeAssert() {
  const data = _interopRequireDefault(require("node:assert"));
  _nodeAssert = function () {
    return data;
  };
  return data;
}
function _nodeCrypto() {
  const data = _interopRequireDefault(require("node:crypto"));
  _nodeCrypto = function () {
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
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function md5Hash(data) {
  if (data.length === 1) return data[0];
  const hash = _nodeCrypto().default.createHash('md5');
  hash.update(data.join(''));
  return hash.digest('hex');
}
function assertHashedAssetData(data) {
  (0, _nodeAssert().default)('fileHashes' in data, 'Assets must have hashed files. Ensure the expo-asset plugin is installed.');
}
async function getUniversalAssetData(assetPath, localPath, assetDataPlugins, platform, publicPath) {
  const data = await (0, _Assets().getAssetData)(assetPath, localPath, assetDataPlugins, platform, publicPath);
  assertHashedAssetData(data);

  // NOTE(EvanBacon): This is where we modify the asset to include a hash in the name for web cache invalidation.
  if (platform === 'web' && publicPath.includes('?export_path=')) {
    // `local-image.[contenthash]`. Using `.` but this won't work if we ever apply to Android because Android res files cannot contain `.`.
    // TODO: Prevent one multi-res image from updating the hash in all images.
    // @ts-expect-error: name is typed as readonly.
    data.name = `${data.name}.${md5Hash(data.fileHashes)}`;
  }
  return data;
}
async function getAssets(dependencies, options) {
  const promises = [];
  const {
    processModuleFilter
  } = options;
  for (const module of dependencies.values()) {
    if ((0, _js().isJsModule)(module) && processModuleFilter(module) && (0, _js().getJsOutput)(module).type === 'js/module/asset' && _nodePath().default.relative(options.projectRoot, module.path) !== 'package.json') {
      promises.push(getUniversalAssetData(module.path, _nodePath().default.relative(options.projectRoot, module.path), options.assetPlugins, options.platform, options.publicPath));
    }
  }
  return await Promise.all(promises);
}
//# sourceMappingURL=getAssets.js.map