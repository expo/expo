import { ConfigPlugin } from '../Plugin.types';
import { addHistoryItem, getHistoryItem, PluginHistoryItem } from '../utils/history';

/**
 * Prevents the same plugin from being run twice.
 * Used for migrating from unversioned expo config plugins to versioned plugins.
 *
 * @param config
 * @param name
 */
export const withRunOnce: ConfigPlugin<{
  plugin: ConfigPlugin<void>;
  name: PluginHistoryItem['name'];
  version?: PluginHistoryItem['version'];
}> = (config, { plugin, name, version }) => {
  // Detect if a plugin has already been run on this config.
  if (getHistoryItem(config, name)) {
    return config;
  }

  // Push the history item so duplicates cannot be run.
  config = addHistoryItem(config, { name, version });

  return plugin(config);
};

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export function createRunOncePlugin<T>(
  plugin: ConfigPlugin<T>,
  name: string,
  version?: string
): ConfigPlugin<T> {
  return (config, props) => {
    return withRunOnce(config, { plugin: config => plugin(config, props), name, version });
  };
}
