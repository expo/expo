"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _withAndroidNavigationBar() {
  const data = require("./withAndroidNavigationBar");
  _withAndroidNavigationBar = function () {
    return data;
  };
  return data;
}
function _createLegacyPlugin() {
  const data = require("../createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
var _default = exports.default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-navigation-bar',
  fallback: [
  // Android
  _withAndroidNavigationBar().withNavigationBar]
});
//# sourceMappingURL=expo-navigation-bar.js.map