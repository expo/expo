"use strict";

exports.__esModule = true;
exports.env = void 0;
class Env {
  /** Disable auto server root detection for Metro. This will not change the server root to the workspace root. */
  get EXPO_NO_METRO_WORKSPACE_ROOT() {
    return ['true', '1'].includes((process.env.EXPO_NO_METRO_WORKSPACE_ROOT ?? '').toLowerCase());
  }
}
const env = exports.env = new Env();
//# sourceMappingURL=env.js.map