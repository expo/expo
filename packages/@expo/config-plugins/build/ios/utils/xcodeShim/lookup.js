"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.safeGetObject = safeGetObject;
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Safely look up a project object by UUID.
 *
 * `@bacons/xcode`'s `getObject` throws if the UUID is not registered, whereas
 * the legacy library's equivalents (e.g. `getPBXGroupByKey`) returned `null`
 * for missing keys and most plugin code assumes the latter. This helper
 * returns `undefined` instead of throwing.
 */
function safeGetObject(project, uuid) {
  try {
    return project.getObject(uuid);
  } catch {
    return undefined;
  }
}
//# sourceMappingURL=lookup.js.map