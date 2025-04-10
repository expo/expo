"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.edgeToEdgePluginIndex = edgeToEdgePluginIndex;
exports.hasEnabledEdgeToEdge = hasEnabledEdgeToEdge;
exports.loadEdgeToEdgeConfigPlugin = loadEdgeToEdgeConfigPlugin;
function edgeToEdgePluginIndex(config) {
  const noArgumentPluginIndex = config.plugins?.findIndex(plugin => typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge')) ?? -1;
  const argumentPluginIndex = config.plugins?.findIndex(plugin => Array.isArray(plugin) && typeof plugin[0] === 'string' && plugin[0].includes('react-native-edge-to-edge')) ?? -1;
  const pluginIndex = Math.max(noArgumentPluginIndex, argumentPluginIndex);
  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}
function hasEnabledEdgeToEdge(config) {
  return config.android?.edgeToEdgeEnabled === true || edgeToEdgePluginIndex(config) != null;
}
function loadEdgeToEdgeConfigPlugin() {
  try {
    // @ts-ignore <-- edge-to-edge plugin doesn't export a type definition
    const {
      default: plugin
    } = require('react-native-edge-to-edge/app.plugin');
    return plugin;
  } catch {
    return null;
  }
}
//# sourceMappingURL=helpers.js.map