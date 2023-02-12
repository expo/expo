import { ConfigPlugin, PluginParameters, withPlugins } from '@expo/config-plugins';
export declare function createLegacyPlugin({ packageName, fallback, }: {
    packageName: string;
    fallback: ConfigPlugin | PluginParameters<typeof withPlugins>;
}): ConfigPlugin;
