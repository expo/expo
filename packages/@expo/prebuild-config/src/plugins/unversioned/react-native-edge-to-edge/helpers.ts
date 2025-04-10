import type { ExpoConfig } from '@expo/config-types';

import { EdgeToEdgePlugin } from './withEdgeToEdge';

export function edgeToEdgePluginIndex(config: ExpoConfig): number | null {
  const noArgumentPluginIndex =
    config.plugins?.findIndex(
      (plugin) => typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge')
    ) ?? -1;

  const argumentPluginIndex =
    config.plugins?.findIndex(
      (plugin) =>
        Array.isArray(plugin) &&
        typeof plugin[0] === 'string' &&
        plugin[0].includes('react-native-edge-to-edge')
    ) ?? -1;

  const pluginIndex = Math.max(noArgumentPluginIndex, argumentPluginIndex);

  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}

export function hasEnabledEdgeToEdge(config: ExpoConfig) {
  return config.edgeToEdgeEnabled === true || edgeToEdgePluginIndex(config) != null;
}

export function loadEdgeToEdgeConfigPlugin(): EdgeToEdgePlugin | null {
  try {
    // @ts-ignore <-- edge-to-edge plugin doesn't export a type definition
    const { default: plugin } = require('react-native-edge-to-edge/app.plugin');
    return plugin as EdgeToEdgePlugin;
  } catch {
    return null;
  }
}
