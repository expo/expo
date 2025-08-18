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
function _withConfigureEdgeToEdgeEnforcement() {
  const data = require("./withConfigureEdgeToEdgeEnforcement");
  _withConfigureEdgeToEdgeEnforcement = function () {
    return data;
  };
  return data;
}
function _withEdgeToEdgeEnabledGradleProperties() {
  const data = require("./withEdgeToEdgeEnabledGradleProperties");
  _withEdgeToEdgeEnabledGradleProperties = function () {
    return data;
  };
  return data;
}
function _withEnforceNavigationBarContrast() {
  const data = require("./withEnforceNavigationBarContrast");
  _withEnforceNavigationBarContrast = function () {
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
const withEdgeToEdge = (config, {
  projectRoot
}) => {
  return applyEdgeToEdge(config, projectRoot);
};
exports.withEdgeToEdge = withEdgeToEdge;
function applyEdgeToEdge(config, projectRoot) {
  if (config.android?.edgeToEdgeEnabled === false) {
    _configPlugins().WarningAggregator.addWarningAndroid(TAG, '`edgeToEdgeEnabled` field is explicitly set to false in the project app config. In Android 16+ (targetSdkVersion 36) it is no longer be possible to disable edge-to-edge. Learn more:', 'https://expo.fyi/edge-to-edge-rollout');
  }
  const edgeToEdgeEnabled = config.android?.edgeToEdgeEnabled !== false;
  config = (0, _withEdgeToEdgeEnabledGradleProperties().withEdgeToEdgeEnabledGradleProperties)(config, {
    edgeToEdgeEnabled
  });
  // Enable/disable edge-to-edge enforcement
  config = (0, _withConfigureEdgeToEdgeEnforcement().withConfigureEdgeToEdgeEnforcement)(config, {
    disableEdgeToEdgeEnforcement: !edgeToEdgeEnabled
  });
  config = (0, _withEnforceNavigationBarContrast().withEnforceNavigationBarContrast)(config, config.androidNavigationBar?.enforceContrast !== false);

  // We always restore the default theme in case the project has a leftover react-native-edge-to-edge theme from SDK 53.
  // If they are using react-native-edge-to-edge config plugin it'll be reapplied later.
  return (0, _withRestoreDefaultTheme().withRestoreDefaultTheme)(config);
}
var _default = exports.default = withEdgeToEdge;
//# sourceMappingURL=withEdgeToEdge.js.map