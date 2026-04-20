"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyEdgeToEdge = applyEdgeToEdge;
exports.withEdgeToEdge = exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _withRestoreDefaultTheme() {
  const data = require("./withRestoreDefaultTheme");
  _withRestoreDefaultTheme = function () {
    return data;
  };
  return data;
}
const TAG = 'EDGE_TO_EDGE_PLUGIN';
const withEdgeToEdge = config => {
  return applyEdgeToEdge(config);
};
exports.withEdgeToEdge = withEdgeToEdge;
function applyEdgeToEdge(config) {
  if ('edgeToEdgeEnabled' in (config.android ?? {})) {
    _configPlugins().WarningAggregator.addWarningAndroid(TAG, '`edgeToEdgeEnabled` customization is no longer available - Android 16 makes edge-to-edge mandatory. Remove the `edgeToEdgeEnabled` entry from your app.json/app.config.js.');
  }

  // We always restore the default theme in case the project has a leftover react-native-edge-to-edge theme from SDK 53.
  // If they are using react-native-edge-to-edge config plugin it'll be reapplied later.
  return (0, _withRestoreDefaultTheme().withRestoreDefaultTheme)(config);
}
var _default = exports.default = withEdgeToEdge;
//# sourceMappingURL=withEdgeToEdge.js.map