"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "AndroidManifest", {
  enumerable: true,
  get: function () {
    return _Manifest().AndroidManifest;
  }
});
Object.defineProperty(exports, "ExpoPlist", {
  enumerable: true,
  get: function () {
    return _IosConfig().ExpoPlist;
  }
});
Object.defineProperty(exports, "InfoPlist", {
  enumerable: true,
  get: function () {
    return _IosConfig().InfoPlist;
  }
});
Object.defineProperty(exports, "XcodeProject", {
  enumerable: true,
  get: function () {
    return _xcode().XcodeProject;
  }
});
function _xcode() {
  const data = require("xcode");
  _xcode = function () {
    return data;
  };
  return data;
}
function _Manifest() {
  const data = require("./android/Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _IosConfig() {
  const data = require("./ios/IosConfig.types");
  _IosConfig = function () {
    return data;
  };
  return data;
}
//# sourceMappingURL=Plugin.types.js.map