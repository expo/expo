"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.edgeToEdgePluginIndex = edgeToEdgePluginIndex;
exports.hasEnabledEdgeToEdge = hasEnabledEdgeToEdge;
exports.loadEdgeToEdgeConfigPlugin = loadEdgeToEdgeConfigPlugin;
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function edgeToEdgePluginIndex(config) {
  const isEdgeToEdgePluginArray = plugin => Array.isArray(plugin) && typeof plugin[0] === 'string' && plugin[0].includes('react-native-edge-to-edge');
  const isEdgeToEdgePluginString = plugin => typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge');
  const pluginIndex = config.plugins?.findIndex(plugin => isEdgeToEdgePluginString(plugin) || isEdgeToEdgePluginArray(plugin)) ?? -1;
  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}
function hasEnabledEdgeToEdge(config) {
  return config.android?.edgeToEdgeEnabled === true || edgeToEdgePluginIndex(config) != null;
}
function loadEdgeToEdgeConfigPlugin(projectRoot) {
  try {
    let edgeToEdgePath = _resolveFrom().default.silent(projectRoot, 'react-native-edge-to-edge/app.plugin');
    if (edgeToEdgePath == null) {
      const expoPackageRoot = _resolveFrom().default.silent(projectRoot, 'expo/package.json');
      edgeToEdgePath = _resolveFrom().default.silent(expoPackageRoot ?? projectRoot, 'react-native-edge-to-edge/app.plugin');
    }
    if (edgeToEdgePath) {
      const {
        default: plugin
      } = require(edgeToEdgePath);
      return plugin;
    }
  } catch {
    return null;
  }
  return null;
}
//# sourceMappingURL=helpers.js.map