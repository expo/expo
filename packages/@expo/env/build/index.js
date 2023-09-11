"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = void 0;
Object.defineProperty(exports, "getFiles", {
  enumerable: true,
  get: function () {
    return _env().getFiles;
  }
});
Object.defineProperty(exports, "isEnabled", {
  enumerable: true,
  get: function () {
    return _env().isEnabled;
  }
});
exports.load = void 0;
function _env() {
  const data = require("./env");
  _env = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
  get,
  load
} = (0, _env().createControlledEnvironment)();
exports.load = load;
exports.get = get;
//# sourceMappingURL=index.js.map