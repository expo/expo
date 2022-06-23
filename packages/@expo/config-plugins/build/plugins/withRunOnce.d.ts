import { ConfigPlugin } from '../Plugin.types';
import { PluginHistoryItem } from '../utils/history';
/**
 * Prevents the same plugin from being run twice.
 * Used for migrating from unversioned expo config plugins to versioned plugins.
 *
 * @param config
 * @param name
 */
export declare const withRunOnce: ConfigPlugin<{
    plugin: ConfigPlugin<void>;
    name: PluginHistoryItem['name'];
    version?: PluginHistoryItem['version'];
}>;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare function createRunOncePlugin<T>(plugin: ConfigPlugin<T>, name: string, version?: string): ConfigPlugin<T>;
