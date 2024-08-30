"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.env = void 0;
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
class Env {
  /** Disable auto server root detection for Metro. This will not change the server root to the workspace root. */
  get EXPO_NO_METRO_WORKSPACE_ROOT() {
    return (0, _getenv().boolish)('EXPO_NO_METRO_WORKSPACE_ROOT', false);
  }
}
const env = exports.env = new Env();
//# sourceMappingURL=env.js.map