"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processModules = processModules;
function _js() {
  const data = require("./js");
  _js = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function processModules(modules, {
  filter = () => true,
  createModuleId,
  dev,
  includeAsyncPaths,
  projectRoot,
  serverRoot,
  sourceUrl,
  platform,
  baseUrl,
  splitChunks
}) {
  return [...modules].filter(_js().isJsModule).filter(filter).map(module => [module, (0, _js().wrapModule)(module, {
    baseUrl,
    platform,
    splitChunks,
    createModuleId,
    dev,
    includeAsyncPaths,
    projectRoot,
    serverRoot,
    sourceUrl
  })]);
}
//# sourceMappingURL=processModules.js.map