import type { ConfigPlugin } from 'expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 *
 * @param config ExpoConfig
 * @param props Configuration for the config plugin
 */
export declare const withBuildProperties: ConfigPlugin<PluginConfigType>;
export default withBuildProperties;
