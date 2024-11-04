import { ConfigPlugin, StaticPlugin } from '../Plugin.types';
export declare const pluginFileName = "app.plugin.js";
/**
 * Resolve the config plugin from a node module or package.
 * If the module or package does not include a config plugin, this function throws a `PluginError`.
 * The resolution is done in following order:
 *   1. Is the reference a relative file path or an import specifier with file path? e.g. `./file.js`, `pkg/file.js` or `@org/pkg/file.js`?
 *     - Resolve the config plugin as-is
 *   2. If the reference a module? e.g. `expo-font`
 *     - Resolve the root `app.plugin.js` file within the module, e.g. `expo-font/app.plugin.js`
 *   3. Does the module have a valid config plugin in the `main` field?
 *     - Resolve the `main` entry point as config plugin
 */
export declare function resolvePluginForModule(projectRoot: string, pluginReference: string): {
    filePath: string;
    isPluginFile: boolean;
};
export declare function moduleNameIsDirectFileReference(name: string): boolean;
export declare function moduleNameIsPackageReference(name: string): boolean;
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
