import type { ConfigPlugin } from '@expo/config-plugins';
import { PluginConfigType } from './pluginConfig';
/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 * @param config ExpoConfig
 * @param props `PluginConfig` from app.json or app.config.js
 * @ignore
 */
export declare const withBuildProperties: ConfigPlugin<PluginConfigType>;
declare const _default: ConfigPlugin<PluginConfigType>;
export default _default;
