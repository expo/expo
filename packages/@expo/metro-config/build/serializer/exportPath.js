"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExportPathForDependencyWithOptions = getExportPathForDependencyWithOptions;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function getExportPathForDependencyWithOptions(dependencyPath, {
  platform,
  src,
  serverRoot
}) {
  const bundlePath = _path().default.relative(serverRoot, dependencyPath);
  const relativePathname = _path().default.join(_path().default.dirname(bundlePath),
  // Strip the file extension
  _path().default.basename(bundlePath, _path().default.extname(bundlePath)));
  const name = (0, _getCssDeps().fileNameFromContents)({
    filepath: relativePathname,
    src
  });
  return `_expo/static/js/${platform}/${name}.js`;
}
//# sourceMappingURL=exportPath.js.map