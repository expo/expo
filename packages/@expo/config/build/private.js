"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "appendShallowGeneratedConfig", {
  enumerable: true,
  get: function () {
    return _generatedConfig().appendShallowGeneratedConfig;
  }
});
Object.defineProperty(exports, "getGeneratedConfigPath", {
  enumerable: true,
  get: function () {
    return _generatedConfig().getGeneratedConfigPath;
  }
});
function _generatedConfig() {
  const data = require("./generatedConfig");
  _generatedConfig = function () {
    return data;
  };
  return data;
}
//# sourceMappingURL=private.js.map