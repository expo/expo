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

let ProjectPrivacy;
exports.ProjectPrivacy = ProjectPrivacy;

(function (ProjectPrivacy) {
  ProjectPrivacy["PUBLIC"] = "public";
  ProjectPrivacy["UNLISTED"] = "unlisted";
})(ProjectPrivacy || (exports.ProjectPrivacy = ProjectPrivacy = {}));
//# sourceMappingURL=Config.types.js.map