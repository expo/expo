"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWindowSoftInputModeMode = getWindowSoftInputModeMode;
exports.setWindowSoftInputModeMode = setWindowSoftInputModeMode;
exports.withWindowSoftInputMode = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const ANDROID_WINDOW_SOFT_INPUT_MODE = 'android:windowSoftInputMode';
const MAPPING = {
  pan: 'adjustPan',
  resize: 'adjustResize'
};
const withWindowSoftInputMode = config => {
  return (0, _androidPlugins().withAndroidManifest)(config, async config => {
    config.modResults = setWindowSoftInputModeMode(config, config.modResults);
    return config;
  });
};
exports.withWindowSoftInputMode = withWindowSoftInputMode;
function setWindowSoftInputModeMode(config, androidManifest) {
  const app = (0, _Manifest().getMainActivityOrThrow)(androidManifest);
  app.$[ANDROID_WINDOW_SOFT_INPUT_MODE] = getWindowSoftInputModeMode(config);
  return androidManifest;
}
function getWindowSoftInputModeMode(config) {
  const value = config.android?.softwareKeyboardLayoutMode;
  if (!value) {
    // Default to `adjustResize` or `resize`.
    return 'adjustResize';
  }
  return MAPPING[value] ?? value;
}
//# sourceMappingURL=WindowSoftInputMode.js.map