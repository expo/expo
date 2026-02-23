"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStatusBarStyle = getStatusBarStyle;
exports.setStatusBarStyles = setStatusBarStyles;
exports.withStatusBar = void 0;
function _Styles() {
  const data = require("./Styles");
  _Styles = function () {
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
// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';
// https://developer.android.com/reference/android/R.attr#statusBarColor
const STATUS_BAR_COLOR = 'android:statusBarColor';
const withStatusBar = config => {
  config = withStatusBarStyles(config);
  return config;
};
exports.withStatusBar = withStatusBar;
const withStatusBarStyles = config => {
  return (0, _androidPlugins().withAndroidStyles)(config, config => {
    config.modResults = setStatusBarStyles(config, config.modResults);
    return config;
  });
};
function setStatusBarStyles(config, styles) {
  styles = (0, _Styles().assignStylesValue)(styles, {
    parent: (0, _Styles().getAppThemeGroup)(),
    name: WINDOW_LIGHT_STATUS_BAR,
    value: 'true',
    // Default is light-content, don't need to do anything to set it
    add: getStatusBarStyle(config) === 'dark-content'
  });
  styles = (0, _Styles().assignStylesValue)(styles, {
    parent: (0, _Styles().getAppThemeGroup)(),
    name: STATUS_BAR_COLOR,
    value: '@android:color/transparent',
    add: true
  });
  return styles;
}
function getStatusBarStyle(config) {
  return config.androidStatusBar?.barStyle || 'light-content';
}
//# sourceMappingURL=StatusBar.js.map