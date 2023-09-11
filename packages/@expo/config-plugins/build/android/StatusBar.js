"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStatusBarColor = getStatusBarColor;
exports.getStatusBarStyle = getStatusBarStyle;
exports.getStatusBarTranslucent = getStatusBarTranslucent;
exports.setStatusBarColors = setStatusBarColors;
exports.setStatusBarStyles = setStatusBarStyles;
exports.withStatusBar = void 0;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _Colors() {
  const data = require("./Colors");
  _Colors = function () {
    return data;
  };
  return data;
}
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// https://developer.android.com/reference/android/R.attr#colorPrimaryDark
const COLOR_PRIMARY_DARK_KEY = 'colorPrimaryDark';
// https://developer.android.com/reference/android/R.attr#windowTranslucentStatus
const WINDOW_TRANSLUCENT_STATUS = 'android:windowTranslucentStatus';
// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';
const withStatusBar = config => {
  config = withStatusBarColors(config);
  config = withStatusBarStyles(config);
  return config;
};
exports.withStatusBar = withStatusBar;
const withStatusBarColors = config => {
  return (0, _androidPlugins().withAndroidColors)(config, config => {
    config.modResults = setStatusBarColors(config, config.modResults);
    return config;
  });
};
const withStatusBarStyles = config => {
  return (0, _androidPlugins().withAndroidStyles)(config, config => {
    config.modResults = setStatusBarStyles(config, config.modResults);
    return config;
  });
};
function setStatusBarColors(config, colors) {
  return (0, _Colors().assignColorValue)(colors, {
    name: COLOR_PRIMARY_DARK_KEY,
    value: getStatusBarColor(config)
  });
}
function setStatusBarStyles(config, styles) {
  const hexString = getStatusBarColor(config);
  const floatElement = getStatusBarTranslucent(config);
  styles = (0, _Styles().assignStylesValue)(styles, {
    parent: (0, _Styles().getAppThemeLightNoActionBarGroup)(),
    name: WINDOW_LIGHT_STATUS_BAR,
    targetApi: '23',
    value: 'true',
    // Default is light-content, don't need to do anything to set it
    add: getStatusBarStyle(config) === 'dark-content'
  });
  styles = (0, _Styles().assignStylesValue)(styles, {
    parent: (0, _Styles().getAppThemeLightNoActionBarGroup)(),
    name: WINDOW_TRANSLUCENT_STATUS,
    value: 'true',
    // translucent status bar set in theme
    add: floatElement
  });
  styles = (0, _Styles().assignStylesValue)(styles, {
    parent: (0, _Styles().getAppThemeLightNoActionBarGroup)(),
    name: COLOR_PRIMARY_DARK_KEY,
    value: `@color/${COLOR_PRIMARY_DARK_KEY}`,
    // Remove the color if translucent is used
    add: !!hexString
  });
  return styles;
}
function getStatusBarColor(config) {
  var _config$androidStatus;
  const backgroundColor = (_config$androidStatus = config.androidStatusBar) === null || _config$androidStatus === void 0 ? void 0 : _config$androidStatus.backgroundColor;
  if (backgroundColor) {
    // Drop support for translucent
    (0, _assert().default)(backgroundColor !== 'translucent', `androidStatusBar.backgroundColor must be a valid hex string, instead got: "${backgroundColor}"`);
  }
  return backgroundColor;
}

/**
 * Specifies whether the status bar should be "translucent". When true, the status bar is drawn with `position: absolute` and a gray underlay, when false `position: relative` (pushes content down).
 *
 * @default false
 * @param config
 * @returns
 */
function getStatusBarTranslucent(config) {
  var _config$androidStatus2, _config$androidStatus3;
  return (_config$androidStatus2 = (_config$androidStatus3 = config.androidStatusBar) === null || _config$androidStatus3 === void 0 ? void 0 : _config$androidStatus3.translucent) !== null && _config$androidStatus2 !== void 0 ? _config$androidStatus2 : false;
}
function getStatusBarStyle(config) {
  var _config$androidStatus4;
  return ((_config$androidStatus4 = config.androidStatusBar) === null || _config$androidStatus4 === void 0 ? void 0 : _config$androidStatus4.barStyle) || 'light-content';
}
//# sourceMappingURL=StatusBar.js.map