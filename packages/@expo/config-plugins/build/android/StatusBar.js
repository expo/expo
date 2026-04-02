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
function WarningAggregator() {
  const data = _interopRequireWildcard(require("../utils/warnings"));
  WarningAggregator = function () {
    return data;
  };
  return data;
}
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const TAG = 'STATUS_BAR_PLUGIN';
// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';
// https://developer.android.com/reference/android/R.attr#statusBarColor
const STATUS_BAR_COLOR = 'android:statusBarColor';
const withStatusBar = config => {
  const {
    androidStatusBar = {}
  } = config;
  if ('backgroundColor' in androidStatusBar) {
    WarningAggregator().addWarningAndroid(TAG, 'Due to Android edge-to-edge enforcement, `androidStatusBar.backgroundColor` is deprecated and has no effect. This will be removed in a future release.');
  }
  if ('translucent' in androidStatusBar) {
    WarningAggregator().addWarningAndroid(TAG, 'Due to Android edge-to-edge enforcement, `androidStatusBar.translucent` is deprecated and has no effect. This will be removed in a future release.');
  }
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