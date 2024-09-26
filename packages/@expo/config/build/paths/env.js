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
    if ((0, _getenv().string)('EXPO_USE_METRO_WORKSPACE_ROOT', '')) {
      console.warn('EXPO_USE_METRO_WORKSPACE_ROOT is enabled by default, use EXPO_NO_METRO_WORKSPACE_ROOT instead to disable.');
    }
    return (0, _getenv().boolish)('EXPO_NO_METRO_WORKSPACE_ROOT', false);
  }
}
const env = exports.env = new Env();
//# sourceMappingURL=env.js.map