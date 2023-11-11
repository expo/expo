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
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return (0, _getenv().boolish)('EXPO_DEBUG', false);
  }

  /** Enable the experimental "exotic" mode. [Learn more](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1). */
  get EXPO_USE_EXOTIC() {
    return (0, _getenv().boolish)('EXPO_USE_EXOTIC', false);
  }

  /** The React Metro port that's baked into react-native scripts and tools. */
  get RCT_METRO_PORT() {
    return (0, _getenv().int)('RCT_METRO_PORT', 8081);
  }

  /** Enable auto server root detection for Metro. This will change the server root to the workspace root. */
  get EXPO_USE_METRO_WORKSPACE_ROOT() {
    return (0, _getenv().boolish)('EXPO_USE_METRO_WORKSPACE_ROOT', false);
  }

  /** Disable Environment Variable injection in client bundles. */
  get EXPO_NO_CLIENT_ENV_VARS() {
    return (0, _getenv().boolish)('EXPO_NO_CLIENT_ENV_VARS', false);
  }
}
const env = new Env();
exports.env = env;
//# sourceMappingURL=env.js.map