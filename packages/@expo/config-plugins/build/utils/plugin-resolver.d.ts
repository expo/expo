import { ConfigPlugin, StaticPlugin } from '../Plugin.types';
export declare const pluginFileName = "app.plugin.js";
export declare function resolvePluginForModule(projectRoot: string, modulePath: string): {
    isPluginFile: boolean;
    filePath: string;
};
export declare function moduleNameIsDirectFileReference(name: string): boolean;
export declare function normalizeStaticPlugin(plugin: StaticPlugin | ConfigPlugin | string): StaticPlugin;
export declare function assertInternalProjectRoot(projectRoot?: string): asserts projectRoot;
export declare function resolveConfigPluginFunction(projectRoot: string, pluginReference: string): ConfigPlugin<unknown>;
export declare function resolveConfigPluginFunctionWithInfo(projectRoot: string, pluginReference: string): {
    plugin: ConfigPlugin<unknown>;
    pluginFile: string;
    pluginReference: string;
    isPluginFile: boolean;
};
/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param props.plugin plugin results
 * @param props.pluginFile plugin file path
 * @param props.pluginReference the string used to reference the plugin
 * @param props.isPluginFile is file path from the app.plugin.js module root
 */
export declare function resolveConfigPluginExport({ plugin, pluginFile, pluginReference, isPluginFile, }: {
    plugin: any;
    pluginFile: string;
    pluginReference: string;
    isPluginFile: boolean;
}): ConfigPlugin<unknown>;
