"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSystemBars = exports.setSystemBarsStyles = void 0;
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
const TAG = 'SYSTEM_BARS_PLUGIN';
const setSystemBarsStyles = styles => {
  styles = (0, _Styles().assignStylesValue)(styles, {
    add: true,
    parent: (0, _Styles().getAppThemeGroup)(),
    name: 'android:statusBarColor',
    value: '@android:color/transparent'
  });
  styles = (0, _Styles().assignStylesValue)(styles, {
    add: true,
    parent: (0, _Styles().getAppThemeGroup)(),
    name: 'android:navigationBarColor',
    value: '@android:color/transparent'
  });
  return styles;
};
exports.setSystemBarsStyles = setSystemBarsStyles;
const withSystemBars = config => {
  if ('androidStatusBar' in config) {
    WarningAggregator().addWarningAndroid(TAG, '`androidStatusBar` is deprecated and has no effect. Use the `expo-status-bar` plugin configuration instead.');
  }
  if ('androidNavigationBar' in config) {
    WarningAggregator().addWarningAndroid(TAG, '`androidNavigationBar` is deprecated and has no effect. Use the `expo-navigation-bar` plugin configuration instead.');
  }
  return (0, _androidPlugins().withAndroidStyles)(config, config => {
    config.modResults = setSystemBarsStyles(config.modResults);
    return config;
  });
};
exports.withSystemBars = withSystemBars;
//# sourceMappingURL=SystemBars.js.map