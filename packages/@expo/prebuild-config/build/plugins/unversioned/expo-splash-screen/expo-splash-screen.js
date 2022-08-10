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

function _withAndroidSplashScreen() {
  const data = require("./withAndroidSplashScreen");

  _withAndroidSplashScreen = function () {
    return data;
  };

  return data;
}

function _withIosSplashScreen() {
  const data = require("./withIosSplashScreen");

  _withIosSplashScreen = function () {
    return data;
  };

  return data;
}

var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-splash-screen',
  fallback: [_withAndroidSplashScreen().withAndroidSplashScreen, _withIosSplashScreen().withIosSplashScreen]
});

exports.default = _default;
//# sourceMappingURL=expo-splash-screen.js.map