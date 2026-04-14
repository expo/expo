import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
import type { ExpoConfig } from 'expo/config';
interface InlineManifestState extends PluginPass {
    projectRoot: string;
}
export declare function expoInlineManifestPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<InlineManifestState>;
/**
 * Get the props for a config-plugin
 */
export declare function getConfigPluginProps<Props>(config: ExpoConfig, pluginName: string): Props | null;
export {};
