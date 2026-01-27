"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyEdgeToEdge = applyEdgeToEdge;
exports.withEdgeToEdge = exports.default = void 0;
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
const withEdgeToEdge = config => {
  return applyEdgeToEdge(config);
};
exports.withEdgeToEdge = withEdgeToEdge;
function applyEdgeToEdge(config) {
  config = (0, _withEdgeToEdgeEnabledGradleProperties().withEdgeToEdgeEnabledGradleProperties)(config, {
    edgeToEdgeEnabled: true
  });
  // Enable/disable edge-to-edge enforcement
  config = (0, _withConfigureEdgeToEdgeEnforcement().withConfigureEdgeToEdgeEnforcement)(config, {
    disableEdgeToEdgeEnforcement: false
  });
  config = (0, _withEnforceNavigationBarContrast().withEnforceNavigationBarContrast)(config, config.androidNavigationBar?.enforceContrast !== false);

  // We always restore the default theme in case the project has a leftover react-native-edge-to-edge theme from SDK 53.
  // If they are using react-native-edge-to-edge config plugin it'll be reapplied later.
  return (0, _withRestoreDefaultTheme().withRestoreDefaultTheme)(config);
}
var _default = exports.default = withEdgeToEdge;
//# sourceMappingURL=withEdgeToEdge.js.map