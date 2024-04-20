"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ExpoConfig", {
  enumerable: true,
  get: function () {
    return _configTypes().ExpoConfig;
  }
});
exports.ProjectPrivacy = void 0;
function _configTypes() {
  const data = require("@expo/config-types");
  _configTypes = function () {
    return data;
  };
  return data;
}
let ProjectPrivacy = exports.ProjectPrivacy = /*#__PURE__*/function (ProjectPrivacy) {
  ProjectPrivacy["PUBLIC"] = "public";
  ProjectPrivacy["UNLISTED"] = "unlisted";
  return ProjectPrivacy;
}({});
//# sourceMappingURL=Config.types.js.map