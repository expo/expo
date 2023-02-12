import { ConfigPlugin } from 'expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
/**
 * Config plugin allowing customizing native Android and iOS build properties for managed apps.
 * @param config Expo config for application.
 * @param props Configuration for the build properties plugin.
 */
export declare const withBuildProperties: ConfigPlugin<PluginConfigType>;
export default withBuildProperties;
