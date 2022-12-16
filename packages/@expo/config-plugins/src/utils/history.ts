import { ExpoConfig } from '@expo/config-types';

import { ModPlatform } from '../Plugin.types';

export type PluginHistoryItem = {
  name: string;
  version: string;
  platform?: ModPlatform;
};

export function getHistoryItem(
  config: Pick<ExpoConfig, '_internal'>,
  name: string
): PluginHistoryItem | null {
  return config._internal?.pluginHistory?.[name] ?? null;
}

export function addHistoryItem(
  config: ExpoConfig,
  item: Omit<PluginHistoryItem, 'version'> & { version?: string }
): ExpoConfig {
  if (!config._internal) {
    config._internal = {};
  }
  if (!config._internal.pluginHistory) {
    config._internal.pluginHistory = {};
  }

  if (!item.version) {
    item.version = 'UNVERSIONED';
  }

  config._internal.pluginHistory[item.name] = item;

  return config;
}
