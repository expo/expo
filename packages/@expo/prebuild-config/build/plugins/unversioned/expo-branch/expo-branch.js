"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _createLegacyPlugin() {
  const data = require("../createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
function _withAndroidBranch() {
  const data = require("./withAndroidBranch");
  _withAndroidBranch = function () {
    return data;
  };
  return data;
}
function _withIosBranch() {
  const data = require("./withIosBranch");
  _withIosBranch = function () {
    return data;
  };
  return data;
}
var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-branch',
  fallback: [
  // Android
  _withAndroidBranch().withAndroidBranch,
  // iOS
  _withIosBranch().withIosBranch]
});
exports.default = _default;
//# sourceMappingURL=expo-branch.js.map