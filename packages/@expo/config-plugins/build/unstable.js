"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unstable_project = unstable_project;
function _xcode() {
  const data = require("@bacons/xcode");
  _xcode = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Unstable API surface. Exports prefixed with `unstable_` are subject to
 * breaking changes between minor releases of `@expo/config-plugins`. They
 * exist so plugin authors can opt in to the new typed pbxproj API while it
 * stabilizes.
 */

/**
 * Open an iOS `project.pbxproj` and return a typed `XcodeProject` from
 * `@bacons/xcode`. The replacement for the legacy `xcode.project(filePath)`
 * factory.
 *
 *     const project = unstable_project(filePath);
 *     // ...mutate via the typed API...
 *     fs.writeFileSync(project.filePath, build(project.toJSON()));
 *
 * @unstable This API may change in minor releases until the migration off
 * the legacy `xcode` package settles.
 */
function unstable_project(filePath) {
  return _xcode().XcodeProject.open(filePath);
}
//# sourceMappingURL=unstable.js.map