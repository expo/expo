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
function _withAndroidAdMob() {
  const data = require("./withAndroidAdMob");
  _withAndroidAdMob = function () {
    return data;
  };
  return data;
}
function _withIosAdMob() {
  const data = require("./withIosAdMob");
  _withIosAdMob = function () {
    return data;
  };
  return data;
}
var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-ads-admob',
  fallback: [_withAndroidAdMob().withAndroidAdMob, _withIosAdMob().withIosAdMob]
});
exports.default = _default;
//# sourceMappingURL=expo-ads-admob.js.map