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
function _withAndroidNavigationBar() {
  const data = require("./withAndroidNavigationBar");
  _withAndroidNavigationBar = function () {
    return data;
  };
  return data;
}
var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-navigation-bar',
  fallback: [
  // Android
  _withAndroidNavigationBar().withNavigationBar]
});
exports.default = _default;
//# sourceMappingURL=expo-navigation-bar.js.map