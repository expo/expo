"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "XcodeProjectShim", {
  enumerable: true,
  get: function () {
    return _XcodeProjectShim().XcodeProjectShim;
  }
});
exports.project = project;
function _XcodeProjectShim() {
  const data = require("./XcodeProjectShim");
  _XcodeProjectShim = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Drop-in replacement for the legacy `xcode.project(filepath)` factory. The
 * returned shim mirrors the old library's API on top of `@bacons/xcode`.
 *
 * The legacy two-phase init pattern is preserved:
 *
 *     const project = xcodeShim.project(filepath);
 *     project.parseSync();
 *     // ...mutate...
 *     fs.writeFileSync(project.filepath, project.writeSync());
 *
 * @deprecated The shim is a deprecation bridge for the legacy `xcode` package
 * API and will be removed in a future major version of `@expo/config-plugins`.
 * Use `unstable_project` from `@expo/config-plugins` to open a typed
 * `XcodeProject` instead.
 */
function project(filePath) {
  return new (_XcodeProjectShim().XcodeProjectShim)(filePath);
}
//# sourceMappingURL=index.js.map