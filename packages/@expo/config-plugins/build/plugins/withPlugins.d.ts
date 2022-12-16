import { ConfigPlugin, StaticPlugin } from '../Plugin.types';
/**
 * Resolves a list of plugins.
 *
 * @param config exported config
 * @param plugins list of config config plugins to apply to the exported config
 */
export declare const withPlugins: ConfigPlugin<(StaticPlugin | ConfigPlugin | string)[]>;
