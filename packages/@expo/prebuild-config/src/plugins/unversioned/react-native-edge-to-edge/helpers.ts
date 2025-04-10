import type { ExpoConfig } from '@expo/config-types';
import resolveFrom from 'resolve-from';

import { EdgeToEdgePlugin } from './withEdgeToEdge';

export function edgeToEdgePluginIndex(config: ExpoConfig): number | null {
  const isEdgeToEdgePluginArray = (plugin: string | [] | [string] | [string, any]) =>
    Array.isArray(plugin) &&
    typeof plugin[0] === 'string' &&
    plugin[0].includes('react-native-edge-to-edge');
  const isEdgeToEdgePluginString = (plugin: string | [] | [string] | [string, any]) =>
    typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge');

  const pluginIndex =
    config.plugins?.findIndex(
      (plugin) => isEdgeToEdgePluginString(plugin) || isEdgeToEdgePluginArray(plugin)
    ) ?? -1;

  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}

export function hasEnabledEdgeToEdge(config: ExpoConfig) {
  return config.android?.edgeToEdgeEnabled === true || edgeToEdgePluginIndex(config) != null;
}

export function loadEdgeToEdgeConfigPlugin(projectRoot: string): EdgeToEdgePlugin | null {
  try {
    const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
    const edgeToEdgePath = resolveFrom.silent(
      expoPackageRoot ?? projectRoot,
      'react-native-edge-to-edge/app.plugin'
    );
    if (edgeToEdgePath) {
      const { default: plugin } = require(edgeToEdgePath);
      return plugin as EdgeToEdgePlugin;
    }
  } catch {
    return null;
  }
  return null;
}
