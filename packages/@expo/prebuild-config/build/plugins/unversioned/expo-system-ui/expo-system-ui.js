"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _withAndroidRootViewBackgroundColor() {
  const data = require("./withAndroidRootViewBackgroundColor");
  _withAndroidRootViewBackgroundColor = function () {
    return data;
  };
  return data;
}
function _withAndroidUserInterfaceStyle() {
  const data = require("./withAndroidUserInterfaceStyle");
  _withAndroidUserInterfaceStyle = function () {
    return data;
  };
  return data;
}
function _withIosRootViewBackgroundColor() {
  const data = require("./withIosRootViewBackgroundColor");
  _withIosRootViewBackgroundColor = function () {
    return data;
  };
  return data;
}
function _withIosUserInterfaceStyle() {
  const data = require("./withIosUserInterfaceStyle");
  _withIosUserInterfaceStyle = function () {
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
  packageName: 'expo-system-ui',
  fallback: [_withAndroidRootViewBackgroundColor().withAndroidRootViewBackgroundColor, _withIosRootViewBackgroundColor().withIosRootViewBackgroundColor, _withAndroidUserInterfaceStyle().withAndroidUserInterfaceStyle, _withIosUserInterfaceStyle().withIosUserInterfaceStyle]
});
//# sourceMappingURL=expo-system-ui.js.map