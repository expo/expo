import type { ConfigPlugin, PluginParameters } from '@expo/config-plugins';
import { withPlugins } from '@expo/config-plugins';
export declare function createLegacyPlugin({ packageName, fallback, }: {
    packageName: string;
    fallback: ConfigPlugin | PluginParameters<typeof withPlugins>;
}): ConfigPlugin;
