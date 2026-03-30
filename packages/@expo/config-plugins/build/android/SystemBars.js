"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSystemBars = void 0;
function WarningAggregator() {
  const data = _interopRequireWildcard(require("../utils/warnings"));
  WarningAggregator = function () {
    return data;
  };
  return data;
}
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const withSystemBars = config => {
  if ('androidStatusBar' in config) {
    WarningAggregator().addWarningAndroid('SYSTEM_BARS_PLUGIN', '`androidStatusBar` is deprecated and has no effect. Use the `expo-status-bar` plugin configuration instead.');
  }
  if ('androidNavigationBar' in config) {
    WarningAggregator().addWarningAndroid('SYSTEM_BARS_PLUGIN', '`androidNavigationBar` is deprecated and has no effect. Use the `expo-navigation-bar` plugin configuration instead.');
  }
  return config;
};
exports.withSystemBars = withSystemBars;
//# sourceMappingURL=SystemBars.js.map